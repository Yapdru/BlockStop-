# BlockStop Kubernetes Deployment Guide

**Phase 28.4 - Docker/Kubernetes Implementation**

Production-ready Kubernetes deployment guide for BlockStop.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Cluster Setup](#cluster-setup)
3. [Installing Kubernetes](#installing-kubernetes)
4. [Deploying BlockStop](#deploying-blockstop)
5. [Scaling & Load Balancing](#scaling--load-balancing)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Disaster Recovery](#backup--disaster-recovery)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- **kubectl** 1.27+
- **Helm** 3.12+ (optional but recommended)
- **Docker** (for building images)
- **Cloud CLI** (AWS, GCP, or Azure depending on provider)

### Installation

**macOS:**
```bash
brew install kubectl helm
brew install --cask docker
```

**Ubuntu/Debian:**
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

**Verify Installation:**
```bash
kubectl version --client
helm version
```

---

## Cluster Setup

### Option 1: Local Development (Minikube)

```bash
# Install Minikube
curl -LO https://github.com/kubernetes/minikube/releases/download/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube cluster
minikube start --cpus=4 --memory=8192 --driver=docker

# Enable ingress addon
minikube addons enable ingress

# Get dashboard
minikube dashboard
```

### Option 2: Docker Desktop Kubernetes

```bash
# Enable Kubernetes in Docker Desktop settings
# Settings > Kubernetes > Enable Kubernetes

# Verify
kubectl cluster-info
```

### Option 3: Cloud Providers

**AWS (EKS):**
```bash
# Create cluster with eksctl
eksctl create cluster \
  --name blockstop-prod \
  --version 1.27 \
  --region us-east-1 \
  --nodegroup-name blockstop-nodes \
  --nodes 3 \
  --node-type t3.large

# Configure kubectl
aws eks update-kubeconfig --name blockstop-prod --region us-east-1
```

**Google Cloud (GKE):**
```bash
# Create cluster
gcloud container clusters create blockstop-prod \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-2

# Get credentials
gcloud container clusters get-credentials blockstop-prod --zone us-central1-a
```

**Azure (AKS):**
```bash
# Create cluster
az aks create \
  --resource-group blockstop-rg \
  --name blockstop-prod \
  --node-count 3 \
  --vm-set-type VirtualMachineScaleSets

# Get credentials
az aks get-credentials \
  --resource-group blockstop-rg \
  --name blockstop-prod
```

---

## Installing Kubernetes

### 1. Create Namespace

```bash
kubectl create namespace blockstop
kubectl config set-context --current --namespace=blockstop
```

### 2. Create Secrets

```bash
# Database credentials
kubectl create secret generic blockstop-db-secret \
  --from-literal=username=blockstop \
  --from-literal=password=$(openssl rand -base64 32) \
  -n blockstop

# OAuth credentials
kubectl create secret generic blockstop-oauth \
  --from-literal=client-id=YOUR_CLIENT_ID \
  --from-literal=client-secret=YOUR_CLIENT_SECRET \
  -n blockstop

# TLS certificate
kubectl create secret tls blockstop-tls \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  -n blockstop
```

### 3. Create ConfigMaps

```bash
# API configuration
kubectl create configmap blockstop-api-config \
  --from-literal=LOG_LEVEL=info \
  --from-literal=RATE_LIMIT_WINDOW=900000 \
  -n blockstop

# Nginx configuration
kubectl create configmap blockstop-nginx-config \
  --from-file=nginx.conf \
  -n blockstop
```

### 4. Apply Kubernetes Manifests

```bash
# Apply namespace and RBAC
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/rbac.yaml

# Apply storage
kubectl apply -f kubernetes/storage.yaml

# Apply configmaps and secrets (already created above)
kubectl apply -f kubernetes/configmap.yaml

# Apply database StatefulSet
kubectl apply -f kubernetes/statefulset-db.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n blockstop --timeout=300s

# Apply Redis
kubectl apply -f kubernetes/deployment-redis.yaml

# Apply API
kubectl apply -f kubernetes/deployment-api.yaml

# Apply Web
kubectl apply -f kubernetes/deployment-web.yaml

# Apply Services
kubectl apply -f kubernetes/service.yaml

# Apply Ingress
kubectl apply -f kubernetes/ingress.yaml

# Verify all deployed
kubectl get all -n blockstop
```

---

## Deploying BlockStop

### Manual Deployment

**Step 1: Push images to registry**

```bash
# Build images
docker build -f docker/Dockerfile.api -t blockstop-api:1.0.0 .
docker build -f docker/Dockerfile.web -t blockstop-web:1.0.0 .

# Tag for registry
docker tag blockstop-api:1.0.0 registry.example.com/blockstop-api:1.0.0
docker tag blockstop-web:1.0.0 registry.example.com/blockstop-web:1.0.0

# Push
docker push registry.example.com/blockstop-api:1.0.0
docker push registry.example.com/blockstop-web:1.0.0
```

**Step 2: Update image references in manifests**

```bash
# Edit deployment files to use your registry
kubectl set image deployment/blockstop-api \
  api=registry.example.com/blockstop-api:1.0.0 \
  -n blockstop

kubectl set image deployment/blockstop-web \
  web=registry.example.com/blockstop-web:1.0.0 \
  -n blockstop
```

**Step 3: Verify deployment**

```bash
kubectl get pods -n blockstop
kubectl get svc -n blockstop
kubectl get ingress -n blockstop
```

### Helm Deployment (Recommended)

```bash
# Create Helm values file
cat > helm-values.yaml <<EOF
namespace: blockstop
image:
  registry: registry.example.com
  tag: 1.0.0

api:
  replicas: 3
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 2000m
      memory: 2Gi

web:
  replicas: 2
  resources:
    requests:
      cpu: 250m
      memory: 256Mi

database:
  storage: 20Gi
  backupRetention: 7

ingress:
  enabled: true
  host: blockstop.io
  tls: true
EOF

# Install Helm chart
helm install blockstop ./helm/blockstop \
  -f helm-values.yaml \
  -n blockstop
```

---

## Scaling & Load Balancing

### Scale Deployments

```bash
# Scale API to 5 replicas
kubectl scale deployment blockstop-api --replicas=5 -n blockstop

# Scale Web to 3 replicas
kubectl scale deployment blockstop-web --replicas=3 -n blockstop

# Auto-scaling with HPA
kubectl autoscale deployment blockstop-api \
  --min=2 --max=10 \
  --cpu-percent=80 \
  -n blockstop
```

### Load Balancing

**Ingress Configuration:**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: blockstop-ingress
  namespace: blockstop
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - blockstop.io
      secretName: blockstop-tls
  rules:
    - host: blockstop.io
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: blockstop-api-service
                port:
                  number: 3001
          - path: /
            pathType: Prefix
            backend:
              service:
                name: blockstop-web-service
                port:
                  number: 3000
```

Apply Ingress:

```bash
kubectl apply -f kubernetes/ingress.yaml
```

---

## Monitoring & Logging

### Install Prometheus & Grafana

```bash
# Add Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Username: admin, Password: prom-operator
```

### Configure Logging

**Install ELK Stack:**

```bash
# Install Elasticsearch
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch -n logging --create-namespace

# Install Logstash
helm install logstash elastic/logstash -n logging

# Install Kibana
helm install kibana elastic/kibana -n logging

# Access Kibana
kubectl port-forward -n logging svc/kibana-kibana 5601:5601
```

### Application Logging

```bash
# View logs
kubectl logs -f deployment/blockstop-api -n blockstop
kubectl logs -f deployment/blockstop-web -n blockstop

# View logs from all pods
kubectl logs -l app=blockstop-api --all-containers=true -n blockstop

# Stream logs from multiple pods
kubectl logs -f -l app=blockstop-api --all-containers=true -n blockstop
```

---

## Backup & Disaster Recovery

### Database Backup

**Automated Backups (using CronJob):**

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: blockstop-db-backup
  namespace: blockstop
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:16-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h postgres -U blockstop blockstop_db | \
              gzip > /backup/blockstop_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
            volumeMounts:
            - name: backup
              mountPath: /backup
          volumes:
          - name: backup
            persistentVolumeClaim:
              claimName: blockstop-backup-pvc
          restartPolicy: OnFailure
```

Apply backup job:

```bash
kubectl apply -f kubernetes/cronjob-backup.yaml
```

### Restore from Backup

```bash
# List backups
kubectl exec -it postgres-0 -n blockstop -- ls /backup

# Restore database
kubectl exec -i postgres-0 -n blockstop -- gunzip < /backup/blockstop_backup.sql.gz | \
  psql -U blockstop blockstop_db
```

### Disaster Recovery Plan

```bash
# 1. Backup volumes
kubectl get pvc -n blockstop

# 2. Export cluster configuration
kubectl get all -n blockstop -o yaml > blockstop-config.yaml

# 3. Test restoration
kubectl apply -f blockstop-config.yaml -n blockstop-recovery
```

---

## Troubleshooting

### Pod Issues

```bash
# Describe pod
kubectl describe pod blockstop-api-0 -n blockstop

# View pod logs
kubectl logs blockstop-api-0 -n blockstop

# Execute command in pod
kubectl exec -it blockstop-api-0 -n blockstop -- /bin/sh

# Get pod events
kubectl get events -n blockstop --sort-by='.lastTimestamp'
```

### Networking Issues

```bash
# Test connectivity
kubectl run test-pod --image=busybox -it --rm -- sh
# Inside pod: ping blockstop-db-service
# Inside pod: wget -O- http://blockstop-api-service:3001/health

# Check DNS
kubectl exec -it blockstop-api-0 -n blockstop -- nslookup blockstop-db-service

# View network policies
kubectl get networkpolicies -n blockstop
```

### Storage Issues

```bash
# Check PVC status
kubectl get pvc -n blockstop

# Describe PVC
kubectl describe pvc blockstop-db-pvc -n blockstop

# Check PV status
kubectl get pv

# Check storage class
kubectl get storageclass
```

### Resource Issues

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n blockstop

# Describe node resources
kubectl describe node <node-name>

# Check resource requests/limits
kubectl get pods -n blockstop -o json | \
  jq '.items[] | {name: .metadata.name, resources: .spec.containers[].resources}'
```

### Deployment Issues

```bash
# Check deployment status
kubectl get deployment -n blockstop
kubectl describe deployment blockstop-api -n blockstop

# View rollout history
kubectl rollout history deployment/blockstop-api -n blockstop

# Rollback deployment
kubectl rollout undo deployment/blockstop-api -n blockstop

# Watch rollout
kubectl rollout status deployment/blockstop-api -n blockstop -w
```

---

## Useful Commands

```bash
# Get all resources
kubectl get all -n blockstop

# Watch resources
kubectl get pods -n blockstop -w

# Port forward
kubectl port-forward svc/blockstop-api-service 3001:3001 -n blockstop

# Execute command
kubectl exec -it pod/blockstop-api-0 -n blockstop -- npm run db:migrate

# Copy files
kubectl cp blockstop/blockstop-api-0:/app/logs ./logs

# Delete deployment
kubectl delete deployment blockstop-api -n blockstop

# Scale deployment
kubectl scale deployment blockstop-api --replicas=5 -n blockstop

# Update image
kubectl set image deployment/blockstop-api \
  api=registry.example.com/blockstop-api:1.0.1

# Create debug pod
kubectl run debug --image=busybox --rm -it -- sh

# Check persistent volumes
kubectl get pv
kubectl describe pv <pv-name>

# Stream logs
kubectl logs -f -n blockstop -l app=blockstop-api --all-containers=true
```

---

## Production Best Practices

### Security

- Use RBAC for access control
- Enable Pod Security Policies
- Use sealed secrets for sensitive data
- Enable network policies
- Scan images for vulnerabilities

### High Availability

- Run multiple replicas (minimum 2-3)
- Use PDB (Pod Disruption Budget)
- Enable health checks (liveness/readiness)
- Use node affinity rules
- Enable cluster autoscaling

### Cost Optimization

- Set resource requests/limits
- Use Horizontal Pod Autoscaling
- Use reserved instances
- Monitor costs with cost allocation
- Clean up unused resources

### Compliance

- Enable audit logging
- Use network policies
- Encrypt etcd
- Regular backups
- Compliance scanning

---

**Last Updated:** June 21, 2026  
**Phase:** 28.4 - Docker/Kubernetes
