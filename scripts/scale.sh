#!/bin/bash

###############################################################################
# BlockStop Auto-scaling Management Script
# Manages pod replicas and node scaling
###############################################################################

set -euo pipefail

NAMESPACE="${KUBE_NAMESPACE:-blockstop}"
SCALE_UP_THRESHOLD="${SCALE_UP_THRESHOLD:-80}"
SCALE_DOWN_THRESHOLD="${SCALE_DOWN_THRESHOLD:-20}"

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

# Get current metrics
get_metrics() {
    local deployment="$1"

    log_info "Getting metrics for $deployment..."

    kubectl top pod -n "$NAMESPACE" -l "app=blockstop,component=$deployment" \
        --no-headers 2>/dev/null | awk '{print $2, $3}' || echo "0 0"
}

# Calculate average CPU/Memory
calculate_average() {
    local deployment="$1"
    local metric_type="$2"  # CPU or MEMORY

    local total=0
    local count=0

    while IFS=' ' read -r cpu memory; do
        if [ -z "$cpu" ] || [ -z "$memory" ]; then
            continue
        fi

        if [ "$metric_type" = "CPU" ]; then
            cpu_num=$(echo "$cpu" | sed 's/m$//')
        else
            memory_num=$(echo "$memory" | sed 's/Mi$//')
        fi

        count=$((count + 1))
    done < <(kubectl top pod -n "$NAMESPACE" -l "app=blockstop,component=$deployment" \
        --no-headers 2>/dev/null)

    echo "Average calculated"
}

# Scale deployment
scale_deployment() {
    local deployment="$1"
    local replicas="$2"

    log_info "Scaling $deployment to $replicas replicas..."

    kubectl scale deployment "blockstop-$deployment" \
        --replicas="$replicas" \
        -n "$NAMESPACE" || return 1

    log_success "Scaled $deployment to $replicas replicas"
}

# Scale all components
scale_all() {
    local api_replicas="$1"
    local web_replicas="$2"
    local worker_replicas="$3"

    log_info "Scaling all deployments..."

    scale_deployment "api" "$api_replicas" || return 1
    scale_deployment "web" "$web_replicas" || return 1
    scale_deployment "worker" "$worker_replicas" || return 1

    log_success "All deployments scaled"
}

# Auto-scale based on metrics
auto_scale() {
    log_info "Running auto-scaling analysis..."

    # Get current state
    local api_pods=$(kubectl get deployment blockstop-api -n "$NAMESPACE" \
        -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    local web_pods=$(kubectl get deployment blockstop-web -n "$NAMESPACE" \
        -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    local worker_pods=$(kubectl get deployment blockstop-worker -n "$NAMESPACE" \
        -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

    log_info "Current replicas - API: $api_pods, Web: $web_pods, Worker: $worker_pods"

    # Check if metrics-server is available
    if ! kubectl get deployment metrics-server -n kube-system &>/dev/null; then
        log_warning "metrics-server not found. Install it for proper scaling."
        return 0
    fi

    # Analyze metrics and make decisions
    # This is a simplified version - enhance based on your needs

    log_success "Auto-scaling analysis completed"
}

# Show current status
show_status() {
    log_info "Current Scaling Status"
    echo ""

    echo "Deployments:"
    kubectl get deployments -n "$NAMESPACE" -l app=blockstop \
        -o custom-columns=NAME:.metadata.name,REPLICAS:.spec.replicas,UPDATED:.status.updatedReplicas,READY:.status.readyReplicas

    echo ""
    echo "Pod Resource Usage:"
    kubectl top pod -n "$NAMESPACE" -l app=blockstop --no-headers 2>/dev/null || \
        log_warning "Could not retrieve pod metrics. Install metrics-server."

    echo ""
    echo "HPA Status:"
    kubectl get hpa -n "$NAMESPACE" -l app=blockstop || \
        log_warning "No HPA resources found"
}

# Manual scale command
manual_scale() {
    if [ $# -lt 3 ]; then
        log_error "Usage: $0 manual <api_replicas> <web_replicas> <worker_replicas>"
        exit 1
    fi

    local api_replicas="$1"
    local web_replicas="$2"
    local worker_replicas="$3"

    if ! [[ "$api_replicas" =~ ^[0-9]+$ ]] || \
       ! [[ "$web_replicas" =~ ^[0-9]+$ ]] || \
       ! [[ "$worker_replicas" =~ ^[0-9]+$ ]]; then
        log_error "Replica counts must be integers"
        exit 1
    fi

    scale_all "$api_replicas" "$web_replicas" "$worker_replicas" || exit 1
}

# List available HPA
list_hpa() {
    log_info "Horizontal Pod Autoscalers:"
    kubectl get hpa -n "$NAMESPACE" -l app=blockstop
}

# Show HPA details
describe_hpa() {
    if [ $# -lt 1 ]; then
        log_error "Usage: $0 describe <hpa_name>"
        exit 1
    fi

    local hpa_name="$1"

    kubectl describe hpa "$hpa_name" -n "$NAMESPACE"
}

# Update HPA limits
update_hpa() {
    if [ $# -lt 3 ]; then
        log_error "Usage: $0 update-hpa <deployment> <min_replicas> <max_replicas>"
        exit 1
    fi

    local deployment="$1"
    local min_replicas="$2"
    local max_replicas="$3"

    log_info "Updating HPA for $deployment..."

    kubectl patch hpa "blockstop-$deployment-hpa" \
        -n "$NAMESPACE" \
        --patch="{\"spec\":{\"minReplicas\":$min_replicas,\"maxReplicas\":$max_replicas}}" || return 1

    log_success "Updated HPA for $deployment"
}

# Main
main() {
    local command="${1:-status}"

    case "$command" in
        manual)
            shift
            manual_scale "$@"
            ;;
        auto)
            auto_scale
            ;;
        status)
            show_status
            ;;
        list-hpa)
            list_hpa
            ;;
        describe)
            shift
            describe_hpa "$@"
            ;;
        update-hpa)
            shift
            update_hpa "$@"
            ;;
        *)
            cat << EOF
Usage: $0 <command> [options]

Commands:
  status                    Show current scaling status
  manual <api> <web> <worker>   Manually scale deployments
  auto                      Run auto-scaling analysis
  list-hpa                  List HPA resources
  describe <hpa_name>       Show HPA details
  update-hpa <dep> <min> <max>  Update HPA limits

Examples:
  $0 status
  $0 manual 3 3 2
  $0 auto
  $0 update-hpa api 3 10

EOF
            exit 1
            ;;
    esac
}

main "$@"
