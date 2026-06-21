# BlockStop Docker Setup Guide

**Phase 28.4 - Docker/Kubernetes Implementation**

Complete guide for containerizing and deploying BlockStop using Docker.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Building Images](#building-images)
4. [Running Services](#running-services)
5. [Production Configuration](#production-configuration)
6. [Health Checks](#health-checks)
7. [Scaling](#scaling)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Git** (for cloning)
- **8GB RAM** minimum (16GB recommended)
- **20GB disk space** (for development)

### Installation

**macOS (using Homebrew):**
```bash
brew install docker docker-compose
brew install --cask docker
```

**Ubuntu/Debian:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Verify Installation:**
```bash
docker --version
docker-compose --version
docker ps
```

---

## Development Setup

### 1. Clone Repository

```bash
cd /home/user/BlockStop-
git pull origin main
```

### 2. Configure Environment

Create `.env.development`:

```env
# Database Configuration
DB_USER=blockstop
DB_PASSWORD=blockstop_dev_password
DB_NAME=blockstop_db

# Redis Configuration
REDIS_PASSWORD=blockstop_redis_password

# API Configuration
API_PORT=3001
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production
CORS_ORIGIN=http://localhost:3000

# OAuth Configuration
OAUTH_CLIENT_ID=your_dev_client_id
OAUTH_CLIENT_SECRET=your_dev_client_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Start Development Environment

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### 4. Verify Services

```bash
# Check service status
docker-compose ps

# Test API
curl http://localhost:3001/health

# Test Web App
curl http://localhost:3000

# Test Database
docker-compose exec db psql -U blockstop -d blockstop_db -c "SELECT NOW();"
```

---

## Building Images

### Build All Images

```bash
# Build all images with development args
docker-compose build

# Build specific service
docker-compose build api
docker-compose build web

# Build without cache
docker-compose build --no-cache
```

### Build for Production

```bash
# Use production Dockerfile args
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Tag Images

```bash
# Tag for Docker Hub
docker tag blockstop-api:latest yourregistry/blockstop-api:1.0.0
docker tag blockstop-web:latest yourregistry/blockstop-web:1.0.0

# Tag for local registry
docker tag blockstop-api:latest localhost:5000/blockstop-api:1.0.0
```

### Push to Registry

```bash
# Login to Docker Hub
docker login

# Push images
docker push yourregistry/blockstop-api:1.0.0
docker push yourregistry/blockstop-web:1.0.0
docker push yourregistry/blockstop-db:1.0.0
```

---

## Running Services

### Start Services

```bash
# Start in foreground (for development)
docker-compose up

# Start in background
docker-compose up -d

# Start specific services
docker-compose up -d db redis
docker-compose up -d api web
```

### Access Services

```
Frontend:      http://localhost:3000
API:           http://localhost:3001
Database:      localhost:5432
Redis:         localhost:6379
pgAdmin:       http://localhost:5050
Nginx:         http://localhost:80
```

### Database Operations

```bash
# Connect to database
docker-compose exec db psql -U blockstop -d blockstop_db

# Run migrations
docker-compose exec api npm run db:migrate

# Seed database
docker-compose exec api npm run db:seed

# Backup database
docker-compose exec db pg_dump -U blockstop blockstop_db > backup.sql

# Restore database
docker-compose exec -T db psql -U blockstop blockstop_db < backup.sql
```

### Cache Operations

```bash
# Connect to Redis
docker-compose exec redis redis-cli -a blockstop_redis_password

# Flush cache
docker-compose exec redis redis-cli -a blockstop_redis_password FLUSHALL

# Monitor Redis
docker-compose exec redis redis-cli -a blockstop_redis_password MONITOR
```

---

## Production Configuration

### Environment Setup

Create `.env.production`:

```env
# Database Configuration (use managed RDS/CloudSQL)
DATABASE_URL=postgresql://user:password@prod-db-host:5432/blockstop_prod

# Redis Configuration (use managed ElastiCache/Redis)
REDIS_URL=redis://:password@prod-redis-host:6379

# API Configuration
API_PORT=3001
NODE_ENV=production
JWT_SECRET=use-strong-random-key-here
CORS_ORIGIN=https://blockstop.io

# Enable HTTPS
FORCE_HTTPS=true
SSL_CERT_PATH=/app/certs/cert.pem
SSL_KEY_PATH=/app/certs/key.pem

# Logging
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn

# Performance
CACHE_TTL=3600
RATE_LIMIT_MAX_REQUESTS=1000
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.9'

services:
  api:
    image: blockstop-api:1.0.0
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G

  web:
    image: blockstop-web:1.0.0
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.blockstop.io
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run production services:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Health Checks

### Built-in Health Checks

Each service includes health checks:

```bash
# View health status
docker-compose ps

# Check specific service health
docker inspect blockstop-api --format='{{json .State.Health}}'
```

### Manual Health Checks

```bash
# API Health
curl http://localhost:3001/health

# Web Health
curl http://localhost:3000/health

# Database Health
docker-compose exec db pg_isready -U blockstop

# Redis Health
docker-compose exec redis redis-cli ping

# Nginx Health
curl http://localhost:80/health
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale API service to 3 instances
docker-compose up -d --scale api=3

# Note: This requires proper load balancing
# Use nginx configuration or Docker Swarm/Kubernetes for production
```

### Resource Limits

Update `docker-compose.yml`:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

Apply limits:

```bash
docker-compose up -d
```

---

## Troubleshooting

### Container Won't Start

```bash
# View logs
docker-compose logs api

# Rebuild image
docker-compose build --no-cache api

# Check disk space
docker system df

# Prune unused resources
docker system prune -a
```

### Database Connection Issues

```bash
# Verify database is healthy
docker-compose exec db pg_isready -U blockstop

# Check database logs
docker-compose logs db

# Verify connection string
docker-compose exec api env | grep DATABASE_URL

# Reset database
docker-compose down -v
docker-compose up -d db
```

### Performance Issues

```bash
# Check resource usage
docker stats

# View slow queries (API)
docker-compose logs api | grep "duration:"

# Monitor Redis memory
docker-compose exec redis redis-cli -a blockstop_redis_password INFO memory
```

### Network Issues

```bash
# Check network
docker network inspect blockstop_blockstop-network

# Test service connectivity
docker-compose exec api ping redis
docker-compose exec api psql -h db -U blockstop -c "SELECT 1"

# DNS resolution
docker-compose exec api nslookup db
```

### Volume Issues

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect blockstop_blockstop_db_data

# Check disk usage
du -sh blockstop_blockstop_db_data

# Backup volume
docker run --rm -v blockstop_blockstop_db_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/db_backup.tar.gz -C /data .
```

---

## Best Practices

### Security

```bash
# Use strong credentials
- Change default passwords in .env
- Enable network isolation
- Use TLS for external connections
- Regularly update images
```

### Performance

```bash
# Optimize image sizes
- Use alpine base images
- Remove build dependencies
- Multi-stage builds
- Cache layers efficiently

# Monitor performance
- Use docker stats
- Set resource limits
- Monitor logs regularly
```

### Maintenance

```bash
# Regular tasks
- Update base images: docker pull image:latest
- Prune unused resources: docker system prune
- Backup volumes regularly
- Monitor disk space
- Rotate logs
```

---

## Useful Commands

```bash
# Start fresh
docker-compose down -v && docker-compose up -d

# View real-time logs
docker-compose logs -f --tail=100

# Execute command in service
docker-compose exec api npm run db:migrate

# Copy file from container
docker-compose cp api:/app/logs/api.log ./logs/

# Copy file to container
docker-compose cp ./file.txt api:/app/data/

# Restart service
docker-compose restart api

# Pause/Unpause services
docker-compose pause
docker-compose unpause

# Remove volumes
docker-compose down -v

# Clean up all data
docker system prune -a --volumes
```

---

**Last Updated:** June 21, 2026  
**Phase:** 28.4 - Docker/Kubernetes
