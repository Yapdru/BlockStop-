# BlockOS - BlockStop Operating System

BlockOS is a containerized operating environment for BlockStop PRO, providing a complete security analysis platform with a custom CLI interface.

## Features

- 🐳 **Docker Containerized** - Complete isolated environment
- 💻 **Custom CLI Interface** - Interactive shell for security analysis
- 📊 **PostgreSQL Database** - Persistent data storage
- 🚀 **Production Ready** - Health checks, logging, monitoring
- 🔒 **Security Hardened** - Minimal attack surface

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Start BlockOS environment
docker-compose up -d

# Enter BlockOS shell
docker exec -it blockstop-pro blockos-shell

# Run commands
blockos> email check "Suspicious email content"
blockos> status
blockos> help
```

### Using Docker Directly

```bash
# Build image
docker build -t blockstop-pro:latest .

# Run container
docker run -d \
  --name blockstop \
  -p 3000:3000 \
  -p 5432:5432 \
  blockstop-pro:latest

# Access shell
docker exec -it blockstop blockos-shell
```

## BlockOS CLI Commands

### Email Analysis
```bash
blockos> email check "Click here to verify your account"
blockos> email analyze /path/to/email.txt
blockos> email history
```

### File Scanning
```bash
blockos> file scan /path/to/suspicious.exe
blockos> file scan-dir /home/user/Downloads
blockos> file history
```

### System Management
```bash
blockos> status              # Show system status
blockos> logs [lines]        # View logs
blockos> config show         # Show configuration
blockos> config set key val  # Set configuration
```

### Server Management
```bash
blockos> start               # Start BlockStop server
blockos> stop                # Stop BlockStop server
blockos> restart             # Restart server
```

## Directory Structure

```
blockos/
├── bin/                      # Executable scripts
│   ├── blockos              # CLI tool
│   └── blockos-shell        # Interactive shell
├── init-db.sql              # Database initialization
├── README.md                # This file
└── logs/                    # Log files (mounted)
```

## Configuration

Environment variables can be set in `docker-compose.yml`:

```yaml
environment:
  - BLOCKOS_VERSION=1.0.0
  - DATABASE_URL=postgresql://blockstop:password@postgres:5432/blockstop_pro
  - NEXTAUTH_URL=http://localhost:3000
  - NEXTAUTH_SECRET=your-secret-key
```

## API Endpoints

BlockOS exposes the following API endpoints:

### Email Analysis
```
POST /api/email/check
Content-Type: application/json

{
  "email": "email content or address"
}
```

Response:
```json
{
  "riskScore": 75,
  "threats": ["Phishing attempt detected"],
  "analysis": {
    "phishingRisk": 85,
    "maliciousLinks": 2,
    "spamScore": 40,
    "senderReputation": "suspicious"
  }
}
```

### File Scanning
```
POST /api/file/upload
Content-Type: multipart/form-data

file: <binary file data>
```

## Database

BlockOS includes PostgreSQL with pre-configured schema for:

- User management
- Email scan history
- File scan history
- Security alerts
- Audit logs
- System statistics

Access the database:

```bash
docker exec -it blockstop-db psql -U blockstop -d blockstop_pro
```

## Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

### View Logs
```bash
docker logs blockstop-pro
docker logs blockstop-db
```

### System Status
Inside BlockOS shell:
```bash
blockos> status
```

## Development

For development inside the container:

```bash
# Mount source code
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Inside container
blockos> start  # Starts dev server on port 3000
```

## Security

- Container runs with minimal privileges
- Database uses strong authentication
- API validation on all inputs
- Security headers configured
- Audit logging enabled

## Troubleshooting

### Port already in use
```bash
docker-compose down
docker-compose up -d
```

### Database connection error
```bash
docker-compose logs postgres
docker exec -it blockstop-db psql -U blockstop -d blockstop_pro
```

### Permission denied on scripts
```bash
chmod +x blockos/bin/*
docker-compose up -d --build
```

## Performance

- Average email analysis: < 100ms
- File scanning: Depends on file size
- Database queries: Optimized with indexes
- Memory usage: ~200MB base + overhead

## Future Enhancements

- [ ] GPU acceleration for ML models
- [ ] Real-time threat intelligence feeds
- [ ] Multi-node clustering
- [ ] Kubernetes integration
- [ ] Advanced visualization dashboards
- [ ] Distributed scanning network

## Support

For issues or questions, create a GitHub issue or contact the BlockStop team.

## License

ISC License - See LICENSE file
