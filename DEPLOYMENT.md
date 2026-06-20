# BlockStop Deployment Guide

Complete deployment instructions for different platforms.

## Quick Start (Local Development)

```bash
# 1. Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# 2. Start with Docker Compose
docker-compose up -d

# 3. Run migrations
npm run migrate

# 4. Visit http://localhost:3000
```

---

## 1. Vercel (Recommended for Next.js)

### Step 1: Deploy

```bash
npm install -g vercel
vercel
```

### Step 2: Configure Environment Variables

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Random 32-byte secret
   - `GOOGLE_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
   - `PAYTM_MERCHANT_ID` - From PayTM
   - `PAYTM_MERCHANT_KEY` - From PayTM

### Step 3: Database Setup

Use Vercel Postgres or external provider:

```bash
# Option A: Vercel Postgres (Built-in)
vercel env pull

# Option B: External PostgreSQL
# Set DATABASE_URL to your PostgreSQL instance
```

### Step 4: Domain & SSL

- Custom domain → Vercel Dashboard → Settings → Domains
- SSL enabled automatically

---

## 2. Docker (Self-Hosted)

### Build Image

```bash
docker build -t blockstop:latest .
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@postgres:5432/blockstop_db \
  -e NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  -e GOOGLE_CLIENT_ID=your-id \
  -e GOOGLE_CLIENT_SECRET=your-secret \
  blockstop:latest
```

### Docker Compose

```bash
# Set variables in .env.local
docker-compose up -d

# Run migrations
docker-compose exec app npm run migrate

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

## 3. AWS Deployment

### Option A: Elastic Container Service (ECS)

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name blockstop
   aws ecr get-login-password | docker login --username AWS --password-stdin [account-id].dkr.ecr.us-east-1.amazonaws.com
   ```

2. **Push Image**
   ```bash
   docker tag blockstop:latest [account-id].dkr.ecr.us-east-1.amazonaws.com/blockstop:latest
   docker push [account-id].dkr.ecr.us-east-1.amazonaws.com/blockstop:latest
   ```

3. **Create ECS Task Definition**
   - Image: ECR image URI
   - Port: 3000
   - Environment variables
   - Memory: 1GB (recommended: 2GB)
   - CPU: 512 (recommended: 1024)

4. **Create ECS Service**
   - Launch type: Fargate
   - Desired count: 2+ (for high availability)
   - Load balancer: ALB

5. **Database**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier blockstop \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username admin
   ```

### Option B: EC2 with Docker

```bash
# 1. SSH into EC2 instance
ssh -i key.pem ec2-user@ip-address

# 2. Install Docker
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# 3. Clone and deploy
git clone <repo> blockstop
cd blockstop

# 4. Run with Docker Compose
docker-compose up -d

# 5. Setup SSL with Let's Encrypt
sudo yum install certbot python3-certbot-nginx -y
sudo certbot certonly --manual -d yourdomain.com
```

---

## 4. Heroku

```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Create app
heroku create blockstop

# 4. Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# 5. Set environment variables
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32)
heroku config:set GOOGLE_CLIENT_ID=your-id
heroku config:set GOOGLE_CLIENT_SECRET=your-secret
heroku config:set PAYTM_MERCHANT_ID=your-id
heroku config:set PAYTM_MERCHANT_KEY=your-key

# 6. Deploy
git push heroku main

# 7. Run migrations
heroku run npm run migrate
```

---

## 5. DigitalOcean App Platform

1. **Connect Repository**
   - GitHub/GitLab account
   - Select BlockStop repository

2. **Configure Service**
   - Buildpack: Node.js
   - Run command: `npm start`
   - HTTP port: 3000

3. **Add Database**
   - PostgreSQL 15
   - Set `DATABASE_URL` variable

4. **Environment Variables**
   - Add all from `.env.example`

5. **Deploy**
   - Click Deploy
   - Wait for build and startup

---

## 6. Linux Server (Ubuntu/Debian)

### Full Setup

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 4. Install Nginx
sudo apt install -y nginx

# 5. Install PM2 (process manager)
sudo npm install -g pm2

# 6. Clone repository
cd /opt
sudo git clone <repo> blockstop
cd blockstop

# 7. Install dependencies
npm install
npm run build

# 8. Setup .env.local
sudo cp .env.example .env.local
sudo nano .env.local  # Edit with your values

# 9. Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE blockstop_db;
CREATE USER blockstop WITH PASSWORD 'secure_password';
ALTER ROLE blockstop SET client_encoding TO 'utf8';
ALTER ROLE blockstop SET default_transaction_isolation TO 'read committed';
ALTER ROLE blockstop SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE blockstop_db TO blockstop;

# 10. Run migrations
npm run migrate

# 11. Start with PM2
pm2 start "npm start" --name blockstop
pm2 startup
pm2 save

# 12. Configure Nginx
sudo nano /etc/nginx/sites-available/blockstop
# Add reverse proxy config (see below)

sudo ln -s /etc/nginx/sites-available/blockstop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 13. SSL Certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate installed
- [ ] Database backups configured
- [ ] Monitoring/logging setup (Sentry, DataDog)
- [ ] CDN configured (Cloudflare, CloudFront)
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] Database indexes optimized
- [ ] Caching strategy configured
- [ ] Health check endpoint working
- [ ] Automated backups scheduled
- [ ] Disaster recovery plan ready
- [ ] Load balancer configured (if multi-instance)
- [ ] Auto-scaling configured

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check application
curl https://yourdomain.com/api/health

# Check database
psql $DATABASE_URL -c "SELECT NOW()"

# View logs
pm2 logs blockstop
docker logs blockstop-app
heroku logs --tail
```

### Backups

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Updates

```bash
# Pull latest
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart
pm2 restart blockstop
```

---

## Troubleshooting

**Port already in use**
```bash
lsof -i :3000
kill -9 <PID>
```

**Database connection failed**
```bash
psql $DATABASE_URL -c "SELECT NOW()"
# Check credentials, host, port
```

**Build fails**
```bash
rm -rf node_modules .next
npm install
npm run build
```

**SSL certificate issues**
```bash
certbot renew --dry-run
certbot renew
```

---

**Happy deploying! 🚀**
