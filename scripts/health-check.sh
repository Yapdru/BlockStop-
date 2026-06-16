#!/bin/bash

###############################################################################
# BlockStop Health Check Script
# Monitors cluster and application health
###############################################################################

set -euo pipefail

NAMESPACE="${KUBE_NAMESPACE:-blockstop}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@blockstop.io}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
CHECK_INTERVAL="${CHECK_INTERVAL:-60}"
VERBOSE="${VERBOSE:-false}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
HEALTHY_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_verbose() {
    if [ "$VERBOSE" = "true" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Check cluster connectivity
check_cluster_connectivity() {
    log_info "Checking cluster connectivity..."

    if kubectl cluster-info &>/dev/null; then
        log_success "Cluster is reachable"
        HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
    else
        log_error "Cannot connect to cluster"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Check namespace exists
check_namespace() {
    log_info "Checking namespace $NAMESPACE..."

    if kubectl get namespace "$NAMESPACE" &>/dev/null; then
        log_success "Namespace exists"
        HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
    else
        log_error "Namespace $NAMESPACE not found"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Check deployment status
check_deployments() {
    log_info "Checking deployments..."

    local deployments=("api" "web" "worker")

    for deployment in "${deployments[@]}"; do
        local name="blockstop-$deployment"
        local desired=$(kubectl get deployment "$name" -n "$NAMESPACE" \
            -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
        local ready=$(kubectl get deployment "$name" -n "$NAMESPACE" \
            -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

        if [ "$desired" -eq "$ready" ] && [ "$ready" -gt 0 ]; then
            log_success "Deployment $name: $ready/$desired ready"
            HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
        elif [ "$ready" -gt 0 ]; then
            log_warning "Deployment $name: $ready/$desired ready"
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
        else
            log_error "Deployment $name: $ready/$desired ready"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    done
}

# Check pod status
check_pods() {
    log_info "Checking pods..."

    local not_ready=$(kubectl get pods -n "$NAMESPACE" -l app=blockstop \
        --field-selector=status.phase!=Running \
        -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)

    if [ -z "$not_ready" ]; then
        local pod_count=$(kubectl get pods -n "$NAMESPACE" -l app=blockstop \
            --field-selector=status.phase=Running -o jsonpath='{.items[*].metadata.name}' | wc -w)
        log_success "All pods are running ($pod_count pods)"
        HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
    else
        log_error "Pods not running: $not_ready"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Check service endpoints
check_services() {
    log_info "Checking services..."

    local services=("api" "web" "worker")

    for service in "${services[@]}"; do
        local name="blockstop-$service"
        local endpoints=$(kubectl get endpoints "$name" -n "$NAMESPACE" \
            -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null | wc -w)

        if [ "$endpoints" -gt 0 ]; then
            log_success "Service $name has $endpoints endpoints"
            HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
        else
            log_error "Service $name has no endpoints"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    done
}

# Check resource availability
check_resources() {
    log_info "Checking node resources..."

    if ! kubectl top nodes &>/dev/null; then
        log_warning "Metrics not available (metrics-server not installed)"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
        return
    fi

    local high_cpu_nodes=$(kubectl top nodes | awk '$2 > 80 {print $1}' | tail -n +2)
    local high_mem_nodes=$(kubectl top nodes | awk '$4 > 80 {print $1}' | tail -n +2)

    if [ -z "$high_cpu_nodes" ] && [ -z "$high_mem_nodes" ]; then
        log_success "Node resources are healthy"
        HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
    else
        [ -n "$high_cpu_nodes" ] && log_warning "High CPU usage on: $high_cpu_nodes"
        [ -n "$high_mem_nodes" ] && log_warning "High memory usage on: $high_mem_nodes"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
}

# Check pod resources
check_pod_resources() {
    log_info "Checking pod resources..."

    if ! kubectl top pods -n "$NAMESPACE" &>/dev/null; then
        log_verbose "Pod metrics not available"
        return
    fi

    local high_usage=$(kubectl top pods -n "$NAMESPACE" -l app=blockstop \
        --no-headers 2>/dev/null | awk '$2 > 500 || $3 > 800 {print $1}')

    if [ -z "$high_usage" ]; then
        log_success "Pod resource usage is normal"
        HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
    else
        log_warning "High resource usage in pods: $high_usage"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
}

# Check persistent volumes
check_volumes() {
    log_info "Checking persistent volumes..."

    local pvcs=$(kubectl get pvc -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)

    if [ -z "$pvcs" ]; then
        log_success "No PVCs found"
        HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
        return
    fi

    local pvc_issues=0
    for pvc in $pvcs; do
        local status=$(kubectl get pvc "$pvc" -n "$NAMESPACE" \
            -o jsonpath='{.status.phase}' 2>/dev/null)

        if [ "$status" != "Bound" ]; then
            log_error "PVC $pvc status: $status"
            pvc_issues=$((pvc_issues + 1))
        else
            log_verbose "PVC $pvc is Bound"
        fi
    done

    if [ $pvc_issues -eq 0 ]; then
        log_success "All PVCs are bound"
        HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
    else
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Check API endpoint
check_api_endpoint() {
    log_info "Checking API endpoint..."

    # Try to connect to API service
    local api_pod=$(kubectl get pod -n "$NAMESPACE" -l app=blockstop,component=api \
        -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [ -z "$api_pod" ]; then
        log_warning "No API pod found"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
        return
    fi

    if kubectl exec -n "$NAMESPACE" "$api_pod" -- curl -sf http://localhost:4000/health &>/dev/null; then
        log_success "API endpoint is healthy"
        HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
    else
        log_error "API endpoint is not responding"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Check web endpoint
check_web_endpoint() {
    log_info "Checking web endpoint..."

    local web_pod=$(kubectl get pod -n "$NAMESPACE" -l app=blockstop,component=web \
        -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [ -z "$web_pod" ]; then
        log_warning "No web pod found"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
        return
    fi

    if kubectl exec -n "$NAMESPACE" "$web_pod" -- curl -sf http://localhost:3000/health &>/dev/null; then
        log_success "Web endpoint is healthy"
        HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
    else
        log_error "Web endpoint is not responding"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Check logs for errors
check_logs() {
    log_info "Checking logs for errors..."

    local error_count=$(kubectl logs -n "$NAMESPACE" -l app=blockstop \
        --tail=100 --timestamps=true 2>/dev/null | grep -i error | wc -l)

    if [ "$error_count" -eq 0 ]; then
        log_success "No recent errors in logs"
        HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
    else
        log_warning "Found $error_count error entries in logs"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
}

# Check events
check_events() {
    log_info "Checking recent events..."

    local warning_events=$(kubectl get events -n "$NAMESPACE" \
        --field-selector type=Warning -o jsonpath='{.items[*].metadata.name}' 2>/dev/null | wc -w)

    if [ "$warning_events" -eq 0 ]; then
        log_success "No warning events"
        HEALTHY_CHECKS=$((HEALTHY_CHECKS + 1))
    else
        log_warning "Found $warning_events warning events"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
}

# Send alert notification
send_alert() {
    local message="$1"
    local severity="$2"  # INFO, WARNING, ERROR

    log_info "Sending alert: $message"

    # Send to Slack if webhook is configured
    if [ -n "$SLACK_WEBHOOK" ]; then
        local color="good"
        [ "$severity" = "WARNING" ] && color="warning"
        [ "$severity" = "ERROR" ] && color="danger"

        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"BlockStop Health Alert\",
                    \"text\": \"$message\",
                    \"ts\": $(date +%s)
                }]
            }" 2>/dev/null || true
    fi
}

# Generate health report
generate_report() {
    echo ""
    echo "======================================"
    echo "BlockStop Health Check Report"
    echo "======================================"
    echo "Timestamp: $(date)"
    echo "Namespace: $NAMESPACE"
    echo ""
    echo "Summary:"
    echo "  Healthy Checks:  $HEALTHY_CHECKS ✓"
    echo "  Warning Checks:  $WARNING_CHECKS ⚠"
    echo "  Failed Checks:   $FAILED_CHECKS ✗"
    echo ""

    local total=$((HEALTHY_CHECKS + WARNING_CHECKS + FAILED_CHECKS))
    local health_percentage=100

    if [ $total -gt 0 ]; then
        health_percentage=$(( (HEALTHY_CHECKS * 100) / total ))
    fi

    echo "Overall Health: $health_percentage%"
    echo "======================================"
    echo ""

    # Send alert if issues found
    if [ $FAILED_CHECKS -gt 0 ]; then
        send_alert "BlockStop Health Check FAILED: $FAILED_CHECKS checks failed" "ERROR"
    elif [ $WARNING_CHECKS -gt 0 ]; then
        send_alert "BlockStop Health Check WARNING: $WARNING_CHECKS checks with warnings" "WARNING"
    fi
}

# Continuous monitoring mode
monitor() {
    log_info "Starting continuous health monitoring (interval: ${CHECK_INTERVAL}s)"
    log_info "Press Ctrl+C to stop"
    echo ""

    while true; do
        clear
        run_all_checks
        generate_report

        log_info "Next check in ${CHECK_INTERVAL}s... (Ctrl+C to stop)"
        sleep "$CHECK_INTERVAL"
    done
}

# Run all checks
run_all_checks() {
    HEALTHY_CHECKS=0
    FAILED_CHECKS=0
    WARNING_CHECKS=0

    check_cluster_connectivity && \
    check_namespace && \
    check_deployments && \
    check_pods && \
    check_services && \
    check_resources && \
    check_pod_resources && \
    check_volumes && \
    check_api_endpoint && \
    check_web_endpoint && \
    check_logs && \
    check_events || true
}

# Main
main() {
    local command="${1:-check}"

    case "$command" in
        check)
            run_all_checks
            generate_report
            ;;
        monitor)
            monitor
            ;;
        *)
            cat << EOF
Usage: $0 <command>

Commands:
  check     Run health check once
  monitor   Run continuous monitoring

Examples:
  $0 check
  $0 monitor

Environment Variables:
  KUBE_NAMESPACE      Kubernetes namespace (default: blockstop)
  CHECK_INTERVAL      Monitoring interval in seconds (default: 60)
  VERBOSE             Enable verbose output (default: false)

EOF
            exit 1
            ;;
    esac
}

main "$@"
