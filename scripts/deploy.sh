#!/bin/bash

###############################################################################
# BlockStop Deployment Script
# Automates deployment to Kubernetes cluster with health checks
###############################################################################

set -euo pipefail

# Configuration
NAMESPACE="${KUBE_NAMESPACE:-blockstop}"
CLUSTER_NAME="${EKS_CLUSTER_NAME:-blockstop-cluster}"
AWS_REGION="${AWS_REGION:-us-east-1}"
DOCKER_REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_NAME="${IMAGE_NAME:-blockstop}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-30}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_tools=()

    command -v kubectl &> /dev/null || missing_tools+=("kubectl")
    command -v aws &> /dev/null || missing_tools+=("aws")
    command -v docker &> /dev/null || missing_tools+=("docker")

    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        return 1
    fi

    log_success "All prerequisites met"
}

# Configure kubectl
configure_kubectl() {
    log_info "Configuring kubectl..."

    aws eks update-kubeconfig \
        --region "$AWS_REGION" \
        --name "$CLUSTER_NAME" 2>/dev/null

    # Verify connection
    if kubectl cluster-info &>/dev/null; then
        log_success "kubectl configured successfully"
    else
        log_error "Failed to configure kubectl"
        return 1
    fi
}

# Verify namespace exists
verify_namespace() {
    log_info "Verifying namespace $NAMESPACE..."

    if kubectl get namespace "$NAMESPACE" &>/dev/null; then
        log_success "Namespace $NAMESPACE exists"
    else
        log_warning "Namespace $NAMESPACE does not exist. Creating..."
        kubectl create namespace "$NAMESPACE" || return 1
    fi
}

# Build and push Docker images
build_images() {
    local version="$1"

    log_info "Building and pushing Docker images (version: $version)..."

    local images=("web" "api" "worker")

    for image in "${images[@]}"; do
        log_info "Building $image image..."

        docker build \
            --file "docker/Dockerfile.$image" \
            --tag "$DOCKER_REGISTRY/$IMAGE_NAME-$image:$version" \
            --tag "$DOCKER_REGISTRY/$IMAGE_NAME-$image:latest" \
            . || return 1

        log_info "Pushing $image image..."
        docker push "$DOCKER_REGISTRY/$IMAGE_NAME-$image:$version" || return 1
        docker push "$DOCKER_REGISTRY/$IMAGE_NAME-$image:latest" || return 1
    done

    log_success "All images built and pushed successfully"
}

# Update deployments
update_deployments() {
    local version="$1"

    log_info "Updating deployments with version $version..."

    local deployments=("api" "web" "worker")
    local -A image_map=(
        ["api"]="api"
        ["web"]="web"
        ["worker"]="worker"
    )

    for deployment in "${deployments[@]}"; do
        local component_name="blockstop-${deployment}"
        local image_name="${image_map[$deployment]}"

        log_info "Updating $component_name deployment..."

        kubectl set image \
            "deployment/$component_name" \
            -n "$NAMESPACE" \
            "$image_name=$DOCKER_REGISTRY/$IMAGE_NAME-$image_name:$version" \
            --record || return 1
    done

    log_success "All deployments updated"
}

# Wait for rollout
wait_for_rollout() {
    log_info "Waiting for deployments to rollout..."

    local deployments=("api" "web" "worker")

    for deployment in "${deployments[@]}"; do
        local component_name="blockstop-${deployment}"

        log_info "Waiting for $component_name rollout..."

        kubectl rollout status \
            "deployment/$component_name" \
            -n "$NAMESPACE" \
            --timeout=10m || return 1
    done

    log_success "All deployments rolled out successfully"
}

# Health checks
perform_health_checks() {
    log_info "Performing health checks..."

    local retries=0
    local healthy=false

    while [ $retries -lt "$HEALTH_CHECK_RETRIES" ]; do
        log_info "Health check attempt $((retries + 1))/$HEALTH_CHECK_RETRIES..."

        # Check API pods
        if kubectl get pods -n "$NAMESPACE" -l app=blockstop,component=api -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -q "True"; then
            log_info "✓ API pods are healthy"
        else
            log_warning "API pods not healthy yet"
            retries=$((retries + 1))
            sleep "$HEALTH_CHECK_INTERVAL"
            continue
        fi

        # Check Web pods
        if kubectl get pods -n "$NAMESPACE" -l app=blockstop,component=web -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -q "True"; then
            log_info "✓ Web pods are healthy"
        else
            log_warning "Web pods not healthy yet"
            retries=$((retries + 1))
            sleep "$HEALTH_CHECK_INTERVAL"
            continue
        fi

        # Check Worker pods
        if kubectl get pods -n "$NAMESPACE" -l app=blockstop,component=worker -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -q "True"; then
            log_info "✓ Worker pods are healthy"
        else
            log_warning "Worker pods not healthy yet"
            retries=$((retries + 1))
            sleep "$HEALTH_CHECK_INTERVAL"
            continue
        fi

        healthy=true
        break
    done

    if [ "$healthy" = true ]; then
        log_success "All health checks passed"
        return 0
    else
        log_error "Health checks failed"
        return 1
    fi
}

# Rollback deployment
rollback_deployment() {
    log_warning "Rolling back deployments..."

    local deployments=("api" "web" "worker")

    for deployment in "${deployments[@]}"; do
        local component_name="blockstop-${deployment}"

        log_info "Rolling back $component_name..."

        kubectl rollout undo \
            "deployment/$component_name" \
            -n "$NAMESPACE" || log_error "Failed to rollback $component_name"
    done

    log_warning "Rollback completed"
}

# Print deployment status
print_status() {
    log_info "Deployment Status:"
    echo ""

    kubectl get deployments -n "$NAMESPACE" -l app=blockstop
    echo ""
    kubectl get pods -n "$NAMESPACE" -l app=blockstop
    echo ""
    kubectl get services -n "$NAMESPACE" -l app=blockstop
}

# Main deployment flow
main() {
    local version="${1:-latest}"

    log_info "Starting BlockStop deployment (version: $version)"
    log_info "Namespace: $NAMESPACE"
    log_info "Region: $AWS_REGION"
    log_info "Cluster: $CLUSTER_NAME"
    echo ""

    # Check prerequisites
    if ! check_prerequisites; then
        log_error "Prerequisites check failed"
        exit 1
    fi

    # Configure kubectl
    if ! configure_kubectl; then
        log_error "kubectl configuration failed"
        exit 1
    fi

    # Verify namespace
    if ! verify_namespace; then
        log_error "Namespace verification failed"
        exit 1
    fi

    # Build images
    if ! build_images "$version"; then
        log_error "Image build failed"
        exit 1
    fi

    # Update deployments
    if ! update_deployments "$version"; then
        log_error "Deployment update failed"
        exit 1
    fi

    # Wait for rollout
    if ! wait_for_rollout; then
        log_error "Rollout failed"

        if [ "$ROLLBACK_ON_FAILURE" = true ]; then
            rollback_deployment
        fi

        exit 1
    fi

    # Perform health checks
    if ! perform_health_checks; then
        log_error "Health checks failed"

        if [ "$ROLLBACK_ON_FAILURE" = true ]; then
            rollback_deployment
        fi

        exit 1
    fi

    # Print final status
    print_status

    log_success "Deployment completed successfully!"
}

# Handle script termination
trap 'log_error "Deployment interrupted"; exit 1' SIGINT SIGTERM

# Run main function
main "$@"
