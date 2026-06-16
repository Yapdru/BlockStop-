#!/bin/bash

###############################################################################
# BlockStop Backup Script
# Manages database and data backups
###############################################################################

set -euo pipefail

NAMESPACE="${KUBE_NAMESPACE:-blockstop}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
AWS_REGION="${AWS_REGION:-us-east-1}"
S3_BUCKET="${S3_BACKUP_BUCKET:-blockstop-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

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

# Initialize backup directory
init_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_success "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup PostgreSQL database
backup_postgres() {
    log_info "Starting PostgreSQL backup..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/postgres_backup_$timestamp.sql.gz"

    # Find PostgreSQL pod
    local pg_pod=$(kubectl get pod -n "$NAMESPACE" \
        -l app=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [ -z "$pg_pod" ]; then
        log_error "PostgreSQL pod not found"
        return 1
    fi

    log_info "Using pod: $pg_pod"

    # Execute backup
    kubectl exec -n "$NAMESPACE" "$pg_pod" -- \
        pg_dump -U blockstop blockstop | gzip > "$backup_file" || return 1

    local file_size=$(du -h "$backup_file" | cut -f1)
    log_success "PostgreSQL backup completed: $backup_file ($file_size)"
}

# Backup Redis
backup_redis() {
    log_info "Starting Redis backup..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/redis_backup_$timestamp.rdb"

    # Find Redis pod
    local redis_pod=$(kubectl get pod -n "$NAMESPACE" \
        -l app=redis -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [ -z "$redis_pod" ]; then
        log_error "Redis pod not found"
        return 1
    fi

    log_info "Using pod: $redis_pod"

    # Create Redis backup
    kubectl exec -n "$NAMESPACE" "$redis_pod" -- redis-cli BGSAVE

    # Wait for backup to complete
    local retries=30
    while [ $retries -gt 0 ]; do
        if kubectl exec -n "$NAMESPACE" "$redis_pod" -- redis-cli LASTSAVE | grep -q .; then
            break
        fi
        sleep 1
        retries=$((retries - 1))
    done

    # Copy backup from pod
    kubectl cp "$NAMESPACE/$redis_pod:/data/dump.rdb" "$backup_file" 2>/dev/null || return 1

    local file_size=$(du -h "$backup_file" | cut -f1)
    log_success "Redis backup completed: $backup_file ($file_size)"
}

# Backup PersistentVolumes
backup_pvc() {
    log_info "Starting PVC backup..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local pvcs=$(kubectl get pvc -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')

    for pvc in $pvcs; do
        log_info "Backing up PVC: $pvc..."

        # Find pod using this PVC
        local pod=$(kubectl get pod -n "$NAMESPACE" \
            -o jsonpath="{.items[?(@.spec.volumes[*].persistentVolumeClaim.claimName=='$pvc')].metadata.name}" \
            | awk '{print $1}')

        if [ -z "$pod" ]; then
            log_warning "No pod found using PVC: $pvc"
            continue
        fi

        # Backup the volume
        local backup_file="$BACKUP_DIR/pvc_${pvc}_backup_$timestamp.tar.gz"

        kubectl exec -n "$NAMESPACE" "$pod" -- tar czf - /data 2>/dev/null > "$backup_file" || {
            log_warning "Failed to backup PVC: $pvc"
            rm -f "$backup_file"
            continue
        }

        local file_size=$(du -h "$backup_file" | cut -f1)
        log_success "PVC $pvc backup completed: ($file_size)"
    done
}

# Upload backups to S3
upload_to_s3() {
    log_info "Uploading backups to S3..."

    if ! command -v aws &> /dev/null; then
        log_warning "AWS CLI not found. Skipping S3 upload."
        return 0
    fi

    for backup_file in "$BACKUP_DIR"/*; do
        if [ -f "$backup_file" ]; then
            local filename=$(basename "$backup_file")

            log_info "Uploading $filename..."

            aws s3 cp "$backup_file" \
                "s3://$S3_BUCKET/$(date +%Y/%m/%d)/$filename" \
                --region "$AWS_REGION" \
                --sse AES256 || log_error "Failed to upload $filename"
        fi
    done

    log_success "S3 upload completed"
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."

    find "$BACKUP_DIR" -type f -mtime +"$RETENTION_DAYS" -exec rm {} \; || true

    log_success "Cleanup completed"
}

# Verify backups
verify_backups() {
    log_info "Verifying backups..."

    local total_size=0
    local backup_count=0

    for backup_file in "$BACKUP_DIR"/*; do
        if [ -f "$backup_file" ]; then
            local size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null)
            local filename=$(basename "$backup_file")

            if [ "$size" -gt 0 ]; then
                log_success "✓ $filename ($(numfmt --to=iec $size 2>/dev/null || echo "$size bytes"))"
                total_size=$((total_size + size))
                backup_count=$((backup_count + 1))
            else
                log_error "✗ $filename (empty)"
            fi
        fi
    done

    echo ""
    echo "Backup Summary:"
    echo "- Total backups: $backup_count"
    echo "- Total size: $(numfmt --to=iec $total_size 2>/dev/null || echo "$total_size bytes")"
}

# Generate backup report
generate_report() {
    local report_file="$BACKUP_DIR/backup_report_$(date +%Y%m%d_%H%M%S).txt"

    cat > "$report_file" << EOF
BlockStop Backup Report
Generated: $(date)

Backup Directory: $BACKUP_DIR
Retention Policy: $RETENTION_DAYS days
S3 Bucket: $S3_BUCKET

Backups Created:
EOF

    for backup_file in "$BACKUP_DIR"/*; do
        if [ -f "$backup_file" ]; then
            local filename=$(basename "$backup_file")
            local size=$(du -h "$backup_file" | cut -f1)
            local modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup_file" 2>/dev/null || \
                            stat -c "%y" "$backup_file" | cut -d' ' -f1-2)

            echo "  - $filename ($size) - $modified" >> "$report_file"
        fi
    done

    log_success "Backup report generated: $report_file"
}

# Full backup workflow
full_backup() {
    log_info "Starting full backup workflow..."
    echo ""

    init_backup_dir

    backup_postgres || log_error "PostgreSQL backup failed"
    backup_redis || log_error "Redis backup failed"
    backup_pvc || log_error "PVC backup failed"

    upload_to_s3 || log_error "S3 upload failed"

    cleanup_old_backups

    verify_backups

    generate_report

    log_success "Full backup workflow completed!"
}

# Main
main() {
    local command="${1:-full}"

    case "$command" in
        full)
            full_backup
            ;;
        postgres)
            init_backup_dir
            backup_postgres
            verify_backups
            ;;
        redis)
            init_backup_dir
            backup_redis
            verify_backups
            ;;
        pvc)
            init_backup_dir
            backup_pvc
            verify_backups
            ;;
        s3)
            upload_to_s3
            ;;
        verify)
            verify_backups
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        *)
            cat << EOF
Usage: $0 <command>

Commands:
  full        Run full backup (all components)
  postgres    Backup PostgreSQL database only
  redis       Backup Redis cache only
  pvc         Backup PersistentVolumes only
  s3          Upload backups to S3
  verify      Verify backup integrity
  cleanup     Remove old backups

Examples:
  $0 full
  $0 postgres
  $0 verify

EOF
            exit 1
            ;;
    esac
}

main "$@"
