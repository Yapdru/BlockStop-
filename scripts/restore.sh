#!/bin/bash

###############################################################################
# BlockStop Restore Script
# Restores database and data from backups
###############################################################################

set -euo pipefail

NAMESPACE="${KUBE_NAMESPACE:-blockstop}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
AWS_REGION="${AWS_REGION:-us-east-1}"
S3_BUCKET="${S3_BACKUP_BUCKET:-blockstop-backups}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# List available backups
list_backups() {
    log_info "Available backups:"
    echo ""

    if [ ! -d "$BACKUP_DIR" ]; then
        log_warning "Backup directory not found: $BACKUP_DIR"
        return 1
    fi

    ls -lh "$BACKUP_DIR"/ | tail -n +2 || log_warning "No backups found"
}

# Restore PostgreSQL from backup
restore_postgres() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    log_warning "⚠️  This will restore the database from: $backup_file"
    read -p "Are you sure? (yes/no): " -r response

    if [ "$response" != "yes" ]; then
        log_info "Restore cancelled"
        return 0
    fi

    log_info "Starting PostgreSQL restore..."

    # Find PostgreSQL pod
    local pg_pod=$(kubectl get pod -n "$NAMESPACE" \
        -l app=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [ -z "$pg_pod" ]; then
        log_error "PostgreSQL pod not found"
        return 1
    fi

    log_info "Using pod: $pg_pod"

    # Check if backup is gzipped
    if [[ "$backup_file" == *.gz ]]; then
        log_info "Decompressing backup..."
        gunzip -c "$backup_file" | kubectl exec -i -n "$NAMESPACE" "$pg_pod" -- \
            psql -U blockstop blockstop || return 1
    else
        kubectl exec -i -n "$NAMESPACE" "$pg_pod" -- \
            psql -U blockstop blockstop < "$backup_file" || return 1
    fi

    log_success "PostgreSQL restore completed!"
}

# Restore Redis from backup
restore_redis() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    log_warning "⚠️  This will restore Redis from: $backup_file"
    read -p "Are you sure? (yes/no): " -r response

    if [ "$response" != "yes" ]; then
        log_info "Restore cancelled"
        return 0
    fi

    log_info "Starting Redis restore..."

    # Find Redis pod
    local redis_pod=$(kubectl get pod -n "$NAMESPACE" \
        -l app=redis -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [ -z "$redis_pod" ]; then
        log_error "Redis pod not found"
        return 1
    fi

    log_info "Using pod: $redis_pod"

    # Stop Redis writes
    kubectl exec -n "$NAMESPACE" "$redis_pod" -- redis-cli SHUTDOWN NOSAVE 2>/dev/null || true

    # Copy backup to pod
    kubectl cp "$backup_file" "$NAMESPACE/$redis_pod:/data/dump.rdb" || return 1

    # Restart Redis pod
    kubectl delete pod -n "$NAMESPACE" "$redis_pod"

    # Wait for pod to restart
    sleep 10
    kubectl wait --for=condition=Ready pod -n "$NAMESPACE" \
        -l app=redis --timeout=300s || return 1

    log_success "Redis restore completed!"
}

# Restore PVC from backup
restore_pvc() {
    local backup_file="$1"
    local pvc_name="$2"

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    log_warning "⚠️  This will restore PVC: $pvc_name from: $backup_file"
    read -p "Are you sure? (yes/no): " -r response

    if [ "$response" != "yes" ]; then
        log_info "Restore cancelled"
        return 0
    fi

    log_info "Starting PVC restore..."

    # Find pod using this PVC
    local pod=$(kubectl get pod -n "$NAMESPACE" \
        -o jsonpath="{.items[?(@.spec.volumes[*].persistentVolumeClaim.claimName=='$pvc_name')].metadata.name}" \
        | awk '{print $1}')

    if [ -z "$pod" ]; then
        log_error "No pod found using PVC: $pvc_name"
        return 1
    fi

    log_info "Using pod: $pod"

    # Create a temporary restore pod if needed
    log_info "Restoring files to PVC..."

    # Check if backup is gzipped
    if [[ "$backup_file" == *.tar.gz ]]; then
        tar xzf "$backup_file" -C / --strip-components=1 2>/dev/null | \
            kubectl exec -i -n "$NAMESPACE" "$pod" bash || return 1
    else
        log_error "Unsupported backup format"
        return 1
    fi

    log_success "PVC restore completed!"
}

# Download backup from S3
download_from_s3() {
    local s3_path="$1"
    local local_path="$2"

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found"
        return 1
    fi

    log_info "Downloading from S3: $s3_path"

    mkdir -p "$(dirname "$local_path")"

    aws s3 cp "s3://$S3_BUCKET/$s3_path" "$local_path" \
        --region "$AWS_REGION" || return 1

    log_success "Downloaded to: $local_path"
}

# Create recovery pod
create_recovery_pod() {
    log_info "Creating recovery pod..."

    cat << 'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: blockstop-recovery
  namespace: blockstop
spec:
  containers:
  - name: recovery
    image: postgres:15-alpine
    volumeMounts:
    - name: backups
      mountPath: /backups
    - name: data
      mountPath: /data
  volumes:
  - name: backups
    hostPath:
      path: /backups
  - name: data
    persistentVolumeClaim:
      claimName: blockstop-db-pvc
  restartPolicy: Never
EOF

    log_success "Recovery pod created"
}

# Delete recovery pod
delete_recovery_pod() {
    log_info "Cleaning up recovery pod..."
    kubectl delete pod blockstop-recovery -n "$NAMESPACE" --ignore-not-found || true
    log_success "Cleanup completed"
}

# Main
main() {
    local command="${1:-list}"

    case "$command" in
        list)
            list_backups
            ;;
        postgres)
            if [ $# -lt 2 ]; then
                log_error "Usage: $0 postgres <backup_file>"
                exit 1
            fi
            restore_postgres "$2"
            ;;
        redis)
            if [ $# -lt 2 ]; then
                log_error "Usage: $0 redis <backup_file>"
                exit 1
            fi
            restore_redis "$2"
            ;;
        pvc)
            if [ $# -lt 3 ]; then
                log_error "Usage: $0 pvc <backup_file> <pvc_name>"
                exit 1
            fi
            restore_pvc "$2" "$3"
            ;;
        s3)
            if [ $# -lt 3 ]; then
                log_error "Usage: $0 s3 <s3_path> <local_path>"
                exit 1
            fi
            download_from_s3 "$2" "$3"
            ;;
        recovery)
            create_recovery_pod
            ;;
        cleanup)
            delete_recovery_pod
            ;;
        *)
            cat << EOF
Usage: $0 <command> [options]

Commands:
  list                      List available backups
  postgres <file>           Restore PostgreSQL from backup
  redis <file>              Restore Redis from backup
  pvc <file> <pvc_name>     Restore PVC from backup
  s3 <s3_path> <local_path> Download backup from S3
  recovery                  Create recovery pod
  cleanup                   Delete recovery pod

Examples:
  $0 list
  $0 postgres backups/postgres_backup_20240101_120000.sql.gz
  $0 redis backups/redis_backup_20240101_120000.rdb
  $0 s3 2024/01/01/postgres_backup.sql.gz backups/
  $0 recovery

EOF
            exit 1
            ;;
    esac
}

main "$@"
