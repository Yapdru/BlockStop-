#!/bin/bash

###############################################################################
# BlockStop CDN Asset Deployment Script
# Deploys static assets to CDN with optimization and caching
###############################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CDN_API_URL="${CDN_API_URL:-http://localhost:3000/api/cdn/assets}"
ASSETS_DIR="${ASSETS_DIR:-./public/assets}"
BATCH_SIZE="${BATCH_SIZE:-10}"
TIMEOUT="${TIMEOUT:-30}"
RETRY_ATTEMPTS="${RETRY_ATTEMPTS:-3}"

# Tracking variables
DEPLOYED_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0
TOTAL_SIZE=0

###############################################################################
# Helper Functions
###############################################################################

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

###############################################################################
# Validate Environment
###############################################################################

validate_environment() {
  log_info "Validating environment..."

  if [ ! -d "$ASSETS_DIR" ]; then
    log_error "Assets directory not found: $ASSETS_DIR"
    exit 1
  fi

  if ! command -v curl &> /dev/null; then
    log_error "curl is required but not installed"
    exit 1
  fi

  if ! command -v gzip &> /dev/null; then
    log_error "gzip is required but not installed"
    exit 1
  fi

  log_success "Environment validation passed"
}

###############################################################################
# Get File Size
###############################################################################

get_file_size() {
  local file="$1"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    stat -f%z "$file" 2>/dev/null || echo 0
  else
    stat -c%s "$file" 2>/dev/null || echo 0
  fi
}

###############################################################################
# Compress Asset
###############################################################################

compress_asset() {
  local file="$1"
  local compressed="${file}.gz"

  # Only compress text-based assets
  case "$file" in
    *.js|*.css|*.html|*.svg|*.json|*.xml)
      if gzip -9 -k -c "$file" > "$compressed" 2>/dev/null; then
        local original_size=$(get_file_size "$file")
        local compressed_size=$(get_file_size "$compressed")

        if [ "$compressed_size" -lt "$original_size" ]; then
          echo "$compressed"
          return 0
        fi
      fi
      ;;
  esac

  # Return original file if compression not beneficial
  echo "$file"
}

###############################################################################
# Get Content Type
###############################################################################

get_content_type() {
  local file="$1"

  case "${file##*.}" in
    js) echo "application/javascript" ;;
    css) echo "text/css" ;;
    html) echo "text/html" ;;
    json) echo "application/json" ;;
    svg) echo "image/svg+xml" ;;
    png) echo "image/png" ;;
    jpg|jpeg) echo "image/jpeg" ;;
    gif) echo "image/gif" ;;
    webp) echo "image/webp" ;;
    woff) echo "font/woff" ;;
    woff2) echo "font/woff2" ;;
    ttf) echo "font/ttf" ;;
    *) echo "application/octet-stream" ;;
  esac
}

###############################################################################
# Deploy Asset with Retry
###############################################################################

deploy_asset() {
  local asset_path="$1"
  local relative_path="$2"
  local attempt=1

  while [ $attempt -le "$RETRY_ATTEMPTS" ]; do
    log_info "Deploying: $relative_path (attempt $attempt/$RETRY_ATTEMPTS)"

    # Compress if beneficial
    local deployed_file=$(compress_asset "$asset_path")
    local content_type=$(get_content_type "$asset_path")
    local file_size=$(get_file_size "$deployed_file")

    # Read file content and deploy
    if response=$(curl -s -w "\n%{http_code}" -X POST "$CDN_API_URL" \
      -H "Content-Type: application/json" \
      --data @- --max-time "$TIMEOUT" << EOF
{
  "path": "$relative_path",
  "content": "$(base64 < "$deployed_file" 2>/dev/null || echo '')",
  "contentType": "$content_type",
  "ttl": 86400
}
EOF
    ); then
      local http_code=$(echo "$response" | tail -n1)
      local body=$(echo "$response" | sed '$d')

      if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        log_success "Deployed: $relative_path (${file_size} bytes)"
        DEPLOYED_COUNT=$((DEPLOYED_COUNT + 1))
        TOTAL_SIZE=$((TOTAL_SIZE + file_size))

        # Clean up compressed file if created
        [ "$deployed_file" != "$asset_path" ] && rm -f "$deployed_file"

        return 0
      else
        log_warning "Failed with HTTP $http_code: $relative_path"
      fi
    else
      log_warning "Connection error deploying $relative_path"
    fi

    attempt=$((attempt + 1))
    if [ $attempt -le "$RETRY_ATTEMPTS" ]; then
      sleep 2
    fi
  done

  log_error "Failed to deploy: $relative_path"
  FAILED_COUNT=$((FAILED_COUNT + 1))
  return 1
}

###############################################################################
# Deploy All Assets
###############################################################################

deploy_all_assets() {
  log_info "Starting asset deployment from $ASSETS_DIR"

  local file_count=0
  local processed=0

  while IFS= read -r -d '' file; do
    local relative_path="${file#$ASSETS_DIR/}"

    # Skip hidden files and directories
    if [[ "$relative_path" =~ /\. || "$relative_path" =~ ^\. ]]; then
      SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
      continue
    fi

    deploy_asset "$file" "$relative_path"

    file_count=$((file_count + 1))

    # Show progress every BATCH_SIZE files
    if [ $((file_count % BATCH_SIZE)) -eq 0 ]; then
      log_info "Progress: $file_count files processed"
    fi
  done < <(find "$ASSETS_DIR" -type f -print0)

  log_info "Asset deployment completed"
}

###############################################################################
# Invalidate Cache
###############################################################################

invalidate_cache() {
  local pattern="${1:-*}"

  log_info "Invalidating cache with pattern: $pattern"

  if response=$(curl -s -X DELETE "$CDN_API_URL?pattern=$pattern" \
    --max-time "$TIMEOUT"); then
    log_success "Cache invalidation request sent"
  else
    log_error "Failed to invalidate cache"
  fi
}

###############################################################################
# Get Deployment Statistics
###############################################################################

get_stats() {
  log_info "Fetching deployment statistics..."

  if response=$(curl -s -X GET "$CDN_API_URL?action=stats" \
    --max-time "$TIMEOUT"); then
    echo "$response"
  else
    log_error "Failed to fetch statistics"
  fi
}

###############################################################################
# Print Summary
###############################################################################

print_summary() {
  echo ""
  echo "=========================================="
  echo "Asset Deployment Summary"
  echo "=========================================="
  echo "Deployed:  $DEPLOYED_COUNT"
  echo "Failed:    $FAILED_COUNT"
  echo "Skipped:   $SKIPPED_COUNT"
  echo "Total Size: $(numfmt --to=iec "$TOTAL_SIZE" 2>/dev/null || echo "$TOTAL_SIZE bytes")"
  echo "=========================================="
  echo ""

  if [ $FAILED_COUNT -gt 0 ]; then
    return 1
  fi
  return 0
}

###############################################################################
# Main Script
###############################################################################

main() {
  log_info "BlockStop CDN Asset Deployment Script"
  echo ""

  # Parse command line arguments
  local action="deploy"
  local pattern="*"

  while [[ $# -gt 0 ]]; do
    case $1 in
      --action)
        action="$2"
        shift 2
        ;;
      --pattern)
        pattern="$2"
        shift 2
        ;;
      --assets-dir)
        ASSETS_DIR="$2"
        shift 2
        ;;
      --api-url)
        CDN_API_URL="$2"
        shift 2
        ;;
      --help)
        show_help
        exit 0
        ;;
      *)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
    esac
  done

  case "$action" in
    deploy)
      validate_environment
      deploy_all_assets
      print_summary
      ;;
    invalidate)
      invalidate_cache "$pattern"
      ;;
    stats)
      get_stats
      ;;
    *)
      log_error "Unknown action: $action"
      show_help
      exit 1
      ;;
  esac
}

show_help() {
  cat << EOF
Usage: $0 [OPTIONS]

Options:
  --action (deploy|invalidate|stats)  Action to perform (default: deploy)
  --pattern PATTERN                    Cache invalidation pattern (default: *)
  --assets-dir DIR                     Assets directory (default: ./public/assets)
  --api-url URL                        CDN API URL (default: http://localhost:3000/api/cdn/assets)
  --help                               Show this help message

Examples:
  $0 --action deploy --assets-dir ./public/assets
  $0 --action invalidate --pattern "*.js"
  $0 --action stats
EOF
}

main "$@"
