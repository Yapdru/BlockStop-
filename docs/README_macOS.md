# BlockStop CLI - Terminal Edition for macOS

**Professional Security Analysis from Your Terminal**

## Overview

BlockStop CLI brings powerful email and file threat analysis to your Mac terminal. Designed for security professionals, DevOps engineers, and system administrators who work in the command line. Full-featured threat detection, incident management, and team collaboration—all from `blockstop` command.

## Features

### Email Analysis
```bash
blockstop email analyze < email.txt
blockstop email check --from sender@domain.com --subject "Urgent Action"
blockstop email batch scan --file emails.txt --format csv
```

- 🔍 **DRAR AI Analysis** - Detect phishing, malware links, spam
- 📊 **Risk Scoring** - Instant threat assessment (0-100)
- 🔗 **URL Analysis** - Check all links for reputation
- 📧 **Sender Verification** - SPF/DKIM/DMARC checks
- 💾 **Batch Processing** - Analyze multiple emails at once

### File Scanning
```bash
blockstop file scan document.pdf
blockstop file scan ~/Downloads --recursive --format json
blockstop file hash SHA256 malware.exe
```

- 📁 **BetterBot PRO** - Comprehensive malware detection
- 🔬 **Signature Matching** - Database of 2M+ signatures
- 📊 **Entropy Analysis** - Detect obfuscation
- 🏷️ **YARA Rules** - Custom rule support
- ⚡ **Fast Processing** - Analyze 100s of files/minute

### Team Collaboration (NEO+)
```bash
blockstop incident create --title "Phishing Campaign" --severity high
blockstop team add user@domain.com
blockstop incident assign --id INC-001 --to analyst@domain.com
blockstop chat send INC-001 "Investigation complete"
```

- 👥 **Team Management** - Invite and manage team members
- 🎯 **Incident Management** - Create, assign, track incidents
- 💬 **Team Chat** - Threaded incident discussions
- 📝 **Note Taking** - Annotate findings
- 📊 **Team Analytics** - Threat trends and metrics

### Integration & Automation
```bash
blockstop webhook add https://hooks.domain.com/threats --event threat.detected
blockstop schedule scan --cron "0 2 * * *" --path ~/suspicious
blockstop export report --format pdf --date 2024-01-01
```

- 🔗 **Webhook Support** - Integrate with any service
- ⏰ **Scheduled Scans** - Automate regular analysis
- 🔄 **Batch Operations** - Process thousands of files
- 📤 **Export Formats** - JSON, CSV, PDF, HTML reports
- 🔌 **API Access** - Full programmatic control

### Security & Compliance
- 🔐 **End-to-End Encryption** - Secure communication
- 🛡️ **API Keys** - Secure authentication
- 📜 **Audit Logging** - Track all actions
- 📋 **GDPR/HIPAA Ready** - Compliance reporting
- 🔒 **Data Retention** - Configurable policies

## System Requirements

- **macOS 10.13+** (High Sierra or newer)
- **Intel or Apple Silicon** (M1/M2/M3)
- **Bash 4.0+** or **Zsh 5.0+**
- **512MB RAM minimum** (2GB+ recommended)
- **500MB disk space**
- **Network connection** (for analysis)

## Installation

### via Homebrew (Recommended)
```bash
brew tap blockstop/tap
brew install blockstop
blockstop --version
```

### via Direct Download
```bash
# Download
curl -O https://blockstop.io/downloads/mac/blockstop-latest.tar.gz

# Extract
tar -xzf blockstop-latest.tar.gz

# Install
cd blockstop
./install.sh

# Verify
blockstop --version
```

### via MacPorts
```bash
sudo port install blockstop
```

### Manual Install
```bash
# Clone repository
git clone https://github.com/blockstop/blockstop-cli.git
cd blockstop-cli

# Install dependencies
./scripts/install-deps.sh

# Build
make build

# Install to /usr/local/bin
make install

# Verify
blockstop --version
```

## Quick Start

### Initial Setup
```bash
# Authenticate
blockstop auth login

# Choose authentication method:
# 1. Passkey (recommended)
# 2. Google/Microsoft OAuth
# 3. Email + Password

# Verify tier
blockstop account info
```

### Analyze an Email
```bash
# Interactive
blockstop email analyze

# From file
blockstop email analyze < email.txt

# With options
blockstop email analyze --from attacker@evil.com --subject "Click here" --show-links

# Output format
blockstop email analyze --format json < email.txt | jq .
```

### Scan a File
```bash
# Single file
blockstop file scan document.pdf

# With detail
blockstop file scan document.pdf --verbose

# Show hashes
blockstop file scan document.pdf --hashes

# JSON output
blockstop file scan document.pdf --format json
```

### Create an Incident
```bash
# Interactive
blockstop incident create

# Command line
blockstop incident create \
  --title "Phishing Campaign" \
  --severity high \
  --description "Multiple phishing emails detected" \
  --tags phishing,urgent

# View incident
blockstop incident view INC-001
```

## Common Commands

### Email Analysis
```bash
# Analyze email
blockstop email analyze

# Batch analyze
blockstop email batch --file emails.txt

# Check sender
blockstop email sender check sender@domain.com

# Analyze links
blockstop email links --from email.txt --check-reputation

# Export results
blockstop email analyze --format csv > results.csv
```

### File Analysis
```bash
# Scan file
blockstop file scan file.exe

# Scan directory
blockstop file scan ~/Downloads --recursive

# Check hash
blockstop file hash SHA256 file.exe

# YARA rules
blockstop file scan --yara rules.yar file.exe

# Quarantine
blockstop file quarantine file.exe
```

### Team Management (NEO+)
```bash
# Add team member
blockstop team add analyst@domain.com

# List team
blockstop team list

# Remove member
blockstop team remove user@domain.com

# Change role
blockstop team role user@domain.com analyst
```

### Incident Management
```bash
# Create incident
blockstop incident create --title "Alert" --severity high

# List incidents
blockstop incident list

# View incident
blockstop incident view INC-001

# Assign incident
blockstop incident assign INC-001 analyst@domain.com

# Close incident
blockstop incident close INC-001 --reason "Resolved"
```

### Integration
```bash
# Add webhook
blockstop webhook add https://hooks.domain.com/alerts

# List webhooks
blockstop webhook list

# Test webhook
blockstop webhook test webhook-id

# Remove webhook
blockstop webhook remove webhook-id
```

### Reporting
```bash
# Generate report
blockstop report generate --format pdf --date 2024-01-01

# Email report
blockstop report email --to analyst@domain.com

# Export data
blockstop export scan-history --format json

# Compliance report
blockstop report compliance --framework gdpr
```

## Configuration

### Config File
```bash
# Create config
blockstop config init

# Edit config
nano ~/.blockstop/config.yml

# Show config
blockstop config show
```

### Config Structure
```yaml
# ~/.blockstop/config.yml
auth:
  method: passkey  # passkey, oauth, email
  api_key: "bsk_..."

output:
  format: json     # json, csv, table, yaml
  colors: true
  verbose: true

team:
  name: "My Team"
  default_team_id: "team_123"

integrations:
  slack:
    webhook_url: "https://hooks.slack.com/..."
  jira:
    url: "https://jira.domain.com"
    api_token: "..."

scanning:
  max_workers: 4
  timeout: 300
  yara_rules_path: "~/.blockstop/yara"
```

### Environment Variables
```bash
# Authentication
export BLOCKSTOP_API_KEY="bsk_..."
export BLOCKSTOP_AUTH_METHOD="passkey"

# Output
export BLOCKSTOP_FORMAT="json"
export BLOCKSTOP_COLORS="true"

# Scanning
export BLOCKSTOP_MAX_WORKERS="4"
export BLOCKSTOP_TIMEOUT="300"

# Team
export BLOCKSTOP_TEAM_ID="team_123"
```

## Advanced Usage

### Scripting & Automation
```bash
#!/bin/bash
# Scan suspicious downloads daily

SCAN_DIR="$HOME/Downloads"
REPORT_FILE="$HOME/scan_reports/daily_$(date +%Y-%m-%d).json"

blockstop file scan "$SCAN_DIR" \
  --recursive \
  --format json \
  --output "$REPORT_FILE"

# Alert if threats found
if grep -q '"risk_level":"high"' "$REPORT_FILE"; then
  blockstop webhook send alert "Threats found in Downloads"
fi
```

### Webhook Integration
```bash
# Slack integration
blockstop webhook add \
  https://hooks.slack.com/services/YOUR/WEBHOOK \
  --event threat.detected \
  --event incident.created

# Jira integration
blockstop webhook add \
  https://jira.domain.com/api/webhooks \
  --event incident.created \
  --format jira
```

### Custom Rules
```bash
# Create YARA rule
cat > ~/.blockstop/yara/custom.yar << 'EOF'
rule suspicious_powershell {
  strings:
    $ps1 = "powershell" nocase
    $exec = "exec" nocase
  condition:
    all of them
}
EOF

# Use in scan
blockstop file scan *.exe --yara ~/.blockstop/yara/custom.yar
```

### Scheduled Scans
```bash
# Add to crontab
crontab -e

# Daily 2am scan
0 2 * * * blockstop file scan ~/suspicious --recursive --format json | blockstop webhook send

# Weekly report
0 0 * * 0 blockstop report generate --format pdf --email admin@domain.com
```

## Tier Features

| Feature | FREE | NEO | PRO | MAX |
|---------|------|-----|-----|-----|
| Email Scan | 50/mo | ∞ | ∞ | ∞ |
| File Scan | 50/mo | ∞ | ∞ | ∞ |
| Team Users | 1 | 3 | 6 | 6 |
| Webhooks | ❌ | ✅ | ✅ | ✅ |
| Automation | ❌ | ✅ | ✅ | ✅ |
| Custom Rules | ❌ | ❌ | ✅ | ✅ |
| AI Chat | ❌ | ❌ | ❌ | ✅ |
| Price | Free | ₹99 | ₹299 | ₹499 |

## Troubleshooting

### Installation Issues
```bash
# Check dependencies
blockstop doctor

# Fix permissions
sudo chown -R $(whoami) ~/.blockstop

# Reinstall
brew reinstall blockstop
```

### Authentication Issues
```bash
# Clear cache
blockstop auth logout
blockstop auth login

# Check API key
blockstop account show
```

### Scan Issues
```bash
# Increase verbosity
blockstop file scan --verbose --debug

# Check file permissions
ls -la file.exe

# Try with sudo if needed
sudo blockstop file scan /System/file
```

## FAQ

**Q: Can I schedule scans?**
A: Yes! Use cron or launchd for automated scanning.

**Q: How do I export results?**
A: Use `--format json|csv|pdf` or `blockstop export`.

**Q: Can I use API keys instead of OAuth?**
A: Yes! Set `BLOCKSTOP_API_KEY` environment variable.

**Q: Is data stored locally?**
A: Scan results cached locally. Full data on BlockStop servers (encrypted).

## Support

- 📧 **Email**: support@blockstop.io
- 💬 **Chat**: `blockstop help`
- 📚 **Docs**: docs.blockstop.io
- 🐛 **Issues**: github.com/blockstop/blockstop-cli/issues

## Contributing

Found a bug? Have a feature request?
```bash
blockstop feedback --type bug
blockstop feedback --type feature
```

---

**Install BlockStop CLI Now**
```bash
brew install blockstop/tap/blockstop
```

**Happy scanning! 🔒**
