# BlockStop Self-Hosting Guide

**Phase 28.4 - Docker/Kubernetes Implementation**

Complete guide for self-hosting BlockStop using open-source, free tools.

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Installation Options](#installation-options)
4. [Quick Start](#quick-start)
5. [Production Deployment](#production-deployment)
6. [Maintenance](#maintenance)
7. [Scaling](#scaling)
8. [Support & Community](#support--community)

---

## Overview

BlockStop can be self-hosted using free, open-source tools:

- **Docker** - Container platform
- **Kubernetes** - Orchestration (optional)
- **PostgreSQL** - Database
- **Redis** - Caching
- **Nginx** - Web server/reverse proxy
- **Let's Encrypt** - Free TLS certificates

**Cost:** Essentially free software licenses + infrastructure costs (hosting)

---

## System Requirements

### Minimum (Small Deployment)

- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 50 GB SSD
- **Network:** 1 Mbps sustained

**Estimated costs (annual):**
- VPS: $120-300 (DigitalOcean, Linode, Hetzner)
- Storage: Included
- **Total:** ~$150/year

### Recommended (Medium Deployment)

- **CPU:** 4 cores
- **RAM:** 8 GB
- **Storage:** 100 GB SSD
- **Network:** 10 Mbps sustained

**Estimated costs (annual):**
- VPS: $300-600
- Backup storage: $50-100
- **Total:** ~$400/year

### Production (Large Deployment)

- **CPU:** 8+ cores
- **RAM:** 16+ GB
- **Storage:** 500+ GB SSD
- **Network:** 100 Mbps sustained

**Estimated costs (annual):**
- Multiple servers: $1000-3000
- Load balancer: $500-1000
- Backup storage: $200-500
- **Total:** ~$2000-4000/year

---

## Installation Options

### Option 1: Docker Compose (Easiest)

**Best for:** Small to medium deployments, single server

```bash
# System requirements
- Ubuntu 20.04 LTS or later
- Docker & Docker Compose installed
- Minimum: 2GB RAM, 20GB storage

# Installation time: ~15 minutes
# Maintenance: Low
# Scaling: Limited
```

### Option 2: Kubernetes (Most Scalable)

**Best for:** Medium to large deployments, multiple servers, HA requirements

```bash
# System requirements
- Ubuntu 20.04 LTS or later
- Kubernetes cluster (3+ nodes)
- kubectl & Helm installed
- Minimum: 4GB RAM per node, 50GB storage per node

# Installation time: ~1 hour
# Maintenance: Medium
# Scaling: Excellent
```

### Option 3: Hybrid (Recommended for Most)

**Best for:** Growing deployments, moderate complexity

```bash
# Docker for application containers
# Docker Swarm or lightweight K3s for orchestration
# Managed database (optional)
# Managed storage (optional)

# Installation time: ~30 minutes
# Maintenance: Low to medium
# Scaling: Good
```

---

## Quick Start

### Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install -y git curl
```

### Clone BlockStop

```bash
# Clone repository
git clone https://github.com/blockstop/blockstop.git
cd blockstop

# Switch to main branch (or stable release)
git checkout main
```

### Configure Environment

```bash
# Create .env file
cat > .env <<EOF
# Database
DB_USER=blockstop
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME=blockstop_db

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32)

# API
API_PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://yourdomain.com

# OAuth (set these!)
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret

# Email (set these for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Domain
DOMAIN=yourdomain.com
EOF

# Make file secure
chmod 600 .env
```

### Start Services

```bash
# Start all services
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f

# Wait for database to initialize (~30 seconds)
sleep 30

# Run database migrations
docker-compose exec api npm run db:migrate

# Create admin user
docker-compose exec api npm run db:seed
```

### Access BlockStop

```
Frontend:   https://yourdomain.com
API:        https://yourdomain.com/api
Admin:      https://yourdomain.com/admin
Email:      yourdomain.com
```

---

## Production Deployment

### 1. Server Setup

```bash
# SSH into your server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y curl git wget nginx certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Domain & SSL

```bash
# Update DNS records (at your domain registrar)
# A record: yourdomain.com -> your-server-ip
# A record: *.yourdomain.com -> your-server-ip
# Wait for DNS propagation (~1 hour)

# Install Let's Encrypt certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificate location: /etc/letsencrypt/live/yourdomain.com/
```

### 3. Nginx Configuration

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/blockstop > /dev/null <<'EOF'
upstream blockstop_api {
    server localhost:3001;
}

upstream blockstop_web {
    server localhost:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # API proxy
    location /api/ {
        proxy_pass http://blockstop_api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Web app
    location / {
        proxy_pass http://blockstop_web;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# Enable configuration
sudo ln -s /etc/nginx/sites-available/blockstop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Docker Setup

```bash
# Clone repository
cd /opt
git clone https://github.com/blockstop/blockstop.git
cd blockstop

# Create production .env
cat > .env.production <<EOF
# Database (use strong password!)
DB_USER=blockstop
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME=blockstop_db

# Redis (use strong password!)
REDIS_PASSWORD=$(openssl rand -base64 32)

# API
API_PORT=3001
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://yourdomain.com

# OAuth
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Logging
LOG_LEVEL=info
SENTRY_DSN=optional_sentry_dsn
EOF

# Set secure permissions
chmod 600 .env.production

# Start services
docker-compose -f docker-compose.yml up -d

# Setup cron job for Let's Encrypt renewal
echo "0 3 * * * /usr/bin/certbot renew --quiet" | crontab -

# Setup backup cron job
cat > /opt/blockstop/backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/blockstop/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U blockstop blockstop_db | gzip > $BACKUP_DIR/blockstop_$DATE.sql.gz
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/blockstop/backup.sh
echo "0 2 * * * /opt/blockstop/backup.sh" | crontab -
```

### 5. Firewall Setup

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 6. Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor system
htop

# Monitor Docker
docker stats

# Monitor logs
docker-compose logs -f --tail=100
```

---

## Maintenance

### Regular Tasks

```bash
# Daily
- Monitor logs
- Check disk space
- Monitor resource usage

# Weekly
- Verify backups
- Check for updates
- Review error logs

# Monthly
- Update Docker images
- Update system packages
- Review security

# Quarterly
- Full backup test
- Security audit
- Performance review
```

### Backup & Recovery

```bash
# Automatic daily backup (via cron)
# Manual backup
docker-compose exec db pg_dump -U blockstop blockstop_db | gzip > backup.sql.gz

# Restore from backup
gunzip < backup.sql.gz | docker-compose exec -T db psql -U blockstop blockstop_db

# Backup volumes
docker run --rm -v blockstop_blockstop_db_data:/data \
  -v /backup:/backup alpine tar czf /backup/db_backup.tar.gz -C /data .
```

### Updates

```bash
# Pull latest code
cd /opt/blockstop
git pull origin main

# Update Docker images
docker-compose pull

# Rebuild if needed
docker-compose build --no-cache

# Restart services
docker-compose restart

# Verify upgrade
docker-compose logs -f
```

### Troubleshooting

```bash
# View service status
docker-compose ps

# View service logs
docker-compose logs api

# Restart service
docker-compose restart api

# Check disk space
df -h

# Check database
docker-compose exec db psql -U blockstop -d blockstop_db -c "SELECT NOW();"

# Check Redis
docker-compose exec redis redis-cli ping
```

---

## Scaling

### Single Server → Multiple Servers

```bash
# 1. Keep database on single server
# 2. Run application containers on multiple servers
# 3. Use shared storage (NFS) for volumes
# 4. Use load balancer (HAProxy or managed LB)

# Install HAProxy for load balancing
sudo apt install -y haproxy

# Configure HAProxy
# ...forward traffic to multiple app servers
```

### Managed Database

```bash
# Instead of Docker PostgreSQL, use:
# - AWS RDS PostgreSQL
# - Google Cloud SQL
# - DigitalOcean Managed Database
# - Azure Database for PostgreSQL

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:pass@managed-db-host:5432/blockstop_db
```

### CDN for Static Assets

```bash
# Use Cloudflare (free tier available)
# - DDoS protection
# - Global CDN
# - Free SSL
# - Automatic optimization

# Or use:
# - Bunny CDN
# - Fastly
# - jsDelivr for CDN (free for open source)
```

---

## Support & Community

### Documentation

- **Official docs:** https://github.com/blockstop/blockstop/wiki
- **API docs:** https://api.blockstop.io/docs
- **Deployment guide:** https://github.com/blockstop/blockstop/blob/main/docs/

### Community

- **GitHub Issues:** https://github.com/blockstop/blockstop/issues
- **GitHub Discussions:** https://github.com/blockstop/blockstop/discussions
- **Email:** support@blockstop.io

### Getting Help

1. Check the documentation
2. Search GitHub issues
3. Post in GitHub discussions
4. Report bugs with detailed information
5. Email support team

### Contributing

```bash
# Fork and clone
git clone https://github.com/your-username/blockstop.git

# Create feature branch
git checkout -b feature/your-feature

# Commit and push
git commit -am "Add your feature"
git push origin feature/your-feature

# Create pull request
# https://github.com/blockstop/blockstop/pulls
```

---

## Useful Resources

- **Docker Docs:** https://docs.docker.com
- **Kubernetes Docs:** https://kubernetes.io/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs
- **Let's Encrypt:** https://letsencrypt.org
- **Nginx Docs:** https://nginx.org/en/docs

---

## Checklist

### Pre-Deployment

- [ ] Domain registered
- [ ] DNS configured
- [ ] Server provisioned
- [ ] SSH access verified
- [ ] Dependencies installed

### Deployment

- [ ] Code cloned
- [ ] .env configured
- [ ] SSL certificate created
- [ ] Nginx configured
- [ ] Docker services running
- [ ] Database migrated
- [ ] Admin user created

### Post-Deployment

- [ ] Services running
- [ ] SSL working
- [ ] Login working
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Firewall configured
- [ ] Users created

---

**Last Updated:** June 21, 2026  
**Phase:** 28.4 - Docker/Kubernetes

For more information, visit: https://github.com/blockstop/blockstop
