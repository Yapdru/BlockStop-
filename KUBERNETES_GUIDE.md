# BlockStop Kubernetes Guide

Complete guide for managing BlockStop on Kubernetes clusters.

## Table of Contents

1. [Cluster Setup](#cluster-setup)
2. [Namespace Management](#namespace-management)
3. [Resource Management](#resource-management)
4. [Deployments](#deployments)
5. [Services & Ingress](#services--ingress)
6. [Storage](#storage)
7. [Configuration](#configuration)
8. [Scaling](#scaling)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

## Cluster Setup

### Initialize EKS Cluster

```bash
# Get cluster info
aws eks describe-cluster \
  --name blockstop-production \
  --query 'cluster.[name,version,status]'

# Update kubeconfig
aws eks update-kubeconfig \
  --name blockstop-production \
  --region us-east-1

# Verify connectivity
kubectl cluster-info
kubectl get nodes
```

### Install Essential Components

```bash
# Metrics Server (for HPA)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# CoreDNS
kubectl apply -f https://k8s.io/examples/admin/dns/coredns.yaml

# Ingress Controller (NGINX)
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# Cert Manager (for TLS)
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true

# AWS EBS CSI Driver
helm repo add aws-ebs-csi-driver https://kubernetes-sigs.github.io/aws-ebs-csi-driver
helm install aws-ebs-csi-driver aws-ebs-csi-driver/aws-ebs-csi-driver \
  --namespace kube-system
```

### Cluster Autoscaling

```bash
# Install Cluster Autoscaler
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  --namespace kube-system \
  --set autoDiscovery.clusterName=blockstop-production \
  --set awsRegion=us-east-1

# Verify
kubectl get deployment cluster-autoscaler -n kube-system
```

## Namespace Management

### Create Namespace

```bash
# Apply namespace manifest
kubectl apply -f kubernetes/namespace.yaml

# Verify
kubectl get namespaces
kubectl describe namespace blockstop

# Set default namespace
kubectl config set-context --current --namespace=blockstop
```

### RBAC Configuration

```bash
# Apply RBAC rules
kubectl apply -f kubernetes/rbac.yaml

# Verify service accounts
kubectl get serviceaccounts -n blockstop

# Verify roles
kubectl get roles -n blockstop
kubectl get rolebindings -n blockstop

# Test permissions
kubectl auth can-i create pods --as=system:serviceaccount:blockstop:blockstop-sa -n blockstop
```

### Network Policies

```bash
# Apply network policies
kubectl apply -f kubernetes/networkpolicy.yaml

# Verify policies
kubectl get networkpolicies -n blockstop

# Test connectivity
kubectl run test-pod --rm -it --image=busybox --command -- wget -qO- http://blockstop-api:4000/health
```

## Resource Management

### Resource Quotas

```bash
# Create resource quota
kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: blockstop-quota
  namespace: blockstop
spec:
  hard:
    cpu: "100"
    memory: "200Gi"
    pods: "100"
    services: "20"
    persistentvolumeclaims: "10"
EOF

# View quota usage
kubectl describe quota blockstop-quota -n blockstop
```

### Limit Ranges

```bash
# Create limit range
kubectl apply -f - <<EOF
apiVersion: v1
kind: LimitRange
metadata:
  name: blockstop-limits
  namespace: blockstop
spec:
  limits:
  - type: Pod
    max:
      cpu: "2"
      memory: "2Gi"
    min:
      cpu: "50m"
      memory: "64Mi"
  - type: Container
    max:
      cpu: "1"
      memory: "1Gi"
    min:
      cpu: "50m"
      memory: "64Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
EOF

# View limit ranges
kubectl describe limitrange blockstop-limits -n blockstop
```

## Deployments

### Deploy Web Application

```bash
# Apply deployment
kubectl apply -f kubernetes/deployment-web.yaml

# Monitor rollout
kubectl rollout status deployment/blockstop-web -n blockstop

# View deployment details
kubectl describe deployment blockstop-web -n blockstop

# View pods
kubectl get pods -n blockstop -l component=web
```

### Deploy API Service

```bash
# Apply deployment
kubectl apply -f kubernetes/deployment-api.yaml

# Monitor rollout
kubectl rollout status deployment/blockstop-api -n blockstop

# View logs
kubectl logs -f deployment/blockstop-api -n blockstop --all-containers=true
```

### Deploy Worker Service

```bash
# Apply deployment
kubectl apply -f kubernetes/deployment-worker.yaml

# Monitor rollout
kubectl rollout status deployment/blockstop-worker -n blockstop

# View logs
kubectl logs -f deployment/blockstop-worker -n blockstop
```

### Rolling Updates

```bash
# Update image
kubectl set image deployment/blockstop-web \
  web=ghcr.io/blockstop/blockstop-web:v2.0.0 \
  -n blockstop

# Monitor rollout
kubectl rollout status deployment/blockstop-web -n blockstop

# Rollback if needed
kubectl rollout undo deployment/blockstop-web -n blockstop

# View rollout history
kubectl rollout history deployment/blockstop-web -n blockstop
```

### Pod Disruption Budgets

```bash
# View PDBs
kubectl get pdb -n blockstop

# Ensure minimum available pods
kubectl get pdb blockstop-web-pdb -n blockstop -o yaml

# Test disruption
kubectl drain <node-name> --ignore-daemonsets --dry-run=client
```

## Services & Ingress

### Services

```bash
# View services
kubectl get svc -n blockstop

# Get load balancer IP
kubectl get svc blockstop-web-lb -n blockstop \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Port forward for testing
kubectl port-forward svc/blockstop-api 4000:4000 -n blockstop

# DNS resolution
kubectl get svc blockstop-api -n blockstop \
  -o jsonpath='{.metadata.name}.{.metadata.namespace}.svc.cluster.local'
```

### Ingress

```bash
# View ingress
kubectl get ingress -n blockstop

# Get ingress details
kubectl describe ingress blockstop-ingress -n blockstop

# Test ingress
curl -H "Host: blockstop.com" http://<ingress-ip>/api/health
```

### TLS Configuration

```bash
# View certificates
kubectl get certificates -n blockstop

# Check certificate details
kubectl describe certificate blockstop-tls -n blockstop

# Manual certificate renewal
kubectl delete secret blockstop-tls -n blockstop
kubectl delete certificate blockstop-tls -n blockstop

# Re-create will trigger cert-manager to issue new certificate
kubectl apply -f kubernetes/ingress.yaml
```

## Storage

### Persistent Volumes

```bash
# View PVs and PVCs
kubectl get pv
kubectl get pvc -n blockstop

# Create persistent volume claim
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: blockstop-data
  namespace: blockstop
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: aws-ebs-gp3
EOF

# Mount in pod
volumeMounts:
  - name: data
    mountPath: /data
volumes:
  - name: data
    persistentVolumeClaim:
      claimName: blockstop-data
```

### Storage Classes

```bash
# List storage classes
kubectl get storageclass

# Create custom storage class
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: aws-ebs-gp3
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
EOF
```

### Backup & Restore

```bash
# Backup PVC data
kubectl exec -it <pod-name> -n blockstop -- tar czf - /data | \
  aws s3 cp - s3://blockstop-backups/pvc-$(date +%s).tar.gz

# Restore PVC data
aws s3 cp s3://blockstop-backups/pvc-backup.tar.gz - | \
  kubectl exec -it <pod-name> -n blockstop -- tar xzf - -C /
```

## Configuration

### ConfigMaps

```bash
# Create ConfigMap
kubectl create configmap blockstop-config \
  --from-literal=LOG_LEVEL=info \
  --from-literal=ENVIRONMENT=production \
  -n blockstop

# View ConfigMap
kubectl get configmap blockstop-config -n blockstop -o yaml

# Update ConfigMap
kubectl patch configmap blockstop-config \
  -p '{"data":{"LOG_LEVEL":"debug"}}' \
  -n blockstop
```

### Secrets

```bash
# Create Secret
kubectl create secret generic blockstop-secret \
  --from-literal=DATABASE_PASSWORD='secure-password' \
  --from-literal=API_KEY='api-key' \
  -n blockstop

# View Secrets
kubectl get secrets -n blockstop

# Update Secret
kubectl patch secret blockstop-secret \
  -p '{"data":{"API_KEY":"'$(echo -n new-key | base64)'"}}'
```

### Environment Variables

```yaml
# From ConfigMap
env:
  - name: LOG_LEVEL
    valueFrom:
      configMapKeyRef:
        name: blockstop-config
        key: LOG_LEVEL

# From Secret
env:
  - name: DATABASE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: blockstop-secret
        key: DATABASE_PASSWORD

# Literal value
env:
  - name: NODE_ENV
    value: "production"
```

## Scaling

### Horizontal Pod Autoscaling

```bash
# View HPA
kubectl get hpa -n blockstop

# HPA detailed view
kubectl describe hpa blockstop-web-hpa -n blockstop

# Metrics that trigger scaling
kubectl get hpa blockstop-web-hpa -n blockstop -o jsonpath='{.status.currentMetrics}'

# Manual scale
kubectl scale deployment blockstop-web --replicas=5 -n blockstop

# Update HPA limits
kubectl patch hpa blockstop-web-hpa -p '{"spec":{"minReplicas":5,"maxReplicas":15"}}' -n blockstop
```

### Vertical Pod Autoscaling

```bash
# Install VPA (optional)
git clone https://github.com/kubernetes/autoscaler.git
./autoscaler/vertical-pod-autoscaler/hack/vpa-up.sh

# Create VPA policy
kubectl apply -f - <<EOF
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: blockstop-vpa
  namespace: blockstop
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: blockstop-web
  updatePolicy:
    updateMode: "Auto"
EOF
```

## Monitoring

### Metrics

```bash
# View pod resource usage
kubectl top pods -n blockstop

# View node resource usage
kubectl top nodes

# Detailed metrics
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/blockstop/pods
```

### Logging

```bash
# View logs
kubectl logs deployment/blockstop-web -n blockstop

# Follow logs
kubectl logs -f deployment/blockstop-web -n blockstop

# Multiple containers
kubectl logs deployment/blockstop-web -c web -n blockstop

# Previous logs (if crashed)
kubectl logs deployment/blockstop-web -p -n blockstop

# All replicas
kubectl logs -l app=blockstop,component=web --tail=50 -n blockstop
```

### Events

```bash
# View cluster events
kubectl get events -n blockstop

# Watch events
kubectl get events -n blockstop -w

# Events for specific resource
kubectl describe pod <pod-name> -n blockstop
```

### Health Checks

```bash
# Execute health check
kubectl exec -it <pod-name> -n blockstop -- curl localhost:3000/api/health

# Port forward and test
kubectl port-forward svc/blockstop-api 4000:4000 -n blockstop
curl http://localhost:4000/api/health
```

## Troubleshooting

### Pod Issues

```bash
# Pod not running
kubectl describe pod <pod-name> -n blockstop

# Check events
kubectl get events -n blockstop | grep <pod-name>

# View logs
kubectl logs <pod-name> -n blockstop

# Execute commands
kubectl exec -it <pod-name> -n blockstop -- /bin/sh

# Delete and restart
kubectl delete pod <pod-name> -n blockstop
```

### Resource Issues

```bash
# Check resource limits
kubectl describe node <node-name>

# Check pod resource requests
kubectl get pods -n blockstop -o json | jq '.items[].spec.containers[].resources'

# Check if pod is pending due to resources
kubectl describe pod <pending-pod> -n blockstop | grep -A 5 Events
```

### Network Issues

```bash
# DNS resolution
kubectl run -it --rm debug --image=busybox --command -- nslookup blockstop-api
kubectl run -it --rm debug --image=busybox --command -- nslookup blockstop-api.blockstop

# Test connectivity
kubectl run -it --rm debug --image=busybox --command -- wget -qO- http://blockstop-api:4000/health

# Check services
kubectl get svc -n blockstop
kubectl get endpoints -n blockstop

# Check ingress
kubectl describe ingress blockstop-ingress -n blockstop
```

### Storage Issues

```bash
# Check PVC status
kubectl get pvc -n blockstop
kubectl describe pvc <pvc-name> -n blockstop

# Check PV status
kubectl get pv
kubectl describe pv <pv-name>

# Check storage class
kubectl get storageclass
kubectl describe storageclass aws-ebs-gp3
```

### Deployment Issues

```bash
# Check deployment status
kubectl describe deployment blockstop-web -n blockstop

# Check replica set
kubectl get rs -n blockstop
kubectl describe rs <replica-set-name> -n blockstop

# Check rollout status
kubectl rollout status deployment/blockstop-web -n blockstop

# View rollout history
kubectl rollout history deployment/blockstop-web -n blockstop

# Rollback
kubectl rollout undo deployment/blockstop-web -n blockstop
```

---

## Additional Resources

- [Kubernetes Official Documentation](https://kubernetes.io/docs/)
- [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [Kubernetes Security Hardening](https://kubernetes.io/docs/concepts/security/)
