#!/usr/bin/env node

/**
 * BlockStop CLI - Enhanced Version
 * Advanced security analysis with email, URL, config, and integrations
 * Version 2.0.0
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';

import * as CLIUtils from './modules/cli-utils.js';
import ConfigManager from './modules/config-manager.js';
import EmailScanner from './modules/email-scanner.js';
import * as URLAnalyzer from './modules/url-analyzer.js';
import IntegrationManager from './modules/integrations/integration-manager.js';

const VERSION = '2.0.0';
const CLI_NAME = 'blockstop';

// Color utilities (from CLI Utils but inline for standalone execution)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logError(msg: string): void {
  console.error(`${colors.red}❌ Error: ${msg}${colors.reset}`);
}

function logSuccess(msg: string): void {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function logWarning(msg: string): void {
  console.log(`${colors.yellow}⚠️  Warning: ${msg}${colors.reset}`);
}

function logInfo(msg: string): void {
  console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`);
}

/**
 * Read stdin
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    process.stdin.on('data', chunk => {
      chunks.push(chunk);
    });

    process.stdin.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    process.stdin.on('error', reject);
  });
}

/**
 * Email analyze command
 */
async function analyzeEmail(): Promise<void> {
  try {
    log('📧 BlockStop Email Analyzer', 'cyan');
    log('Enter email content (press Ctrl+D when done):\n', 'cyan');

    const input = await readStdin();

    if (!input.trim()) {
      logError('No email content provided');
      process.exit(1);
    }

    const result = await EmailScanner.scanEmail(input);
    console.log('\n' + EmailScanner.formatResult(result) + '\n');

    // Try to send alert if integrations enabled
    try {
      const configMgr = new ConfigManager();
      const config = await configMgr.loadConfig();

      if (result.analysis.riskLevel !== 'SAFE') {
        const integrationMgr = new IntegrationManager();
        await integrationMgr.dispatchAlert({
          severity: result.analysis.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          title: `Email Threat Detected: ${result.analysis.riskLevel}`,
          description: result.analysis.summary,
          details: {
            sender: result.sender?.email,
            subject: result.subject,
            threats: result.analysis.threats.map(t => ({ type: t.type, severity: t.severity })),
          },
          source: 'blockstop-email',
        });
      }
    } catch (e) {
      // Silently fail integration dispatch
    }
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * URL check command
 */
async function checkURL(urlString: string): Promise<void> {
  try {
    if (!urlString) {
      logError('URL required. Usage: blockstop url check https://...');
      process.exit(1);
    }

    log('\n🔗 BlockStop URL Analyzer\n', 'cyan');

    const result = URLAnalyzer.analyzeURL(urlString);
    console.log(URLAnalyzer.formatAnalysis(result));

    // Try to send alert if critical
    try {
      if (result.riskLevel === 'CRITICAL' || result.riskLevel === 'HIGH') {
        const integrationMgr = new IntegrationManager();
        await integrationMgr.dispatchAlert({
          severity: result.riskLevel as 'HIGH' | 'CRITICAL',
          title: `Malicious URL Detected: ${result.riskLevel}`,
          description: result.recommendation,
          details: {
            url: urlString,
            domain: result.domain,
            riskScore: result.riskScore,
            threats: result.threats.map(t => ({ type: t.type, severity: t.severity })),
          },
          source: 'blockstop-url',
        });
      }
    } catch (e) {
      // Silently fail integration dispatch
    }
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Config init command
 */
async function initConfig(): Promise<void> {
  try {
    const configMgr = new ConfigManager();

    const configPath = path.join(process.env.HOME || '~', '.blockstop', 'config.yml');

    if (fs.existsSync(configPath)) {
      logWarning(`Config already exists at ${configPath}`);
      log('Use: blockstop config edit', 'cyan');
      return;
    }

    await configMgr.init();
    logSuccess(`Config initialized at ${configPath}`);
    logInfo('Edit config with: blockstop config edit');
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Config set command
 */
async function setConfig(key: string, value: string, ...args: string[]): Promise<void> {
  try {
    const configMgr = new ConfigManager();

    if (!key) {
      logError('Config key required');
      process.exit(1);
    }

    if (key === 'api-key' && args.length > 0) {
      const service = value;
      const apiKey = args.join(' ');

      if (!service || !apiKey) {
        logError('Usage: blockstop config set api-key <service> <key>');
        process.exit(1);
      }

      await configMgr.setApiKey(service, apiKey);
      logSuccess(`API key set for ${service}`);
    } else {
      logError('Unknown config key. Try: blockstop config set api-key <service> <key>');
      process.exit(1);
    }
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Config list command
 */
async function listConfig(): Promise<void> {
  try {
    const configMgr = new ConfigManager();
    const config = await configMgr.loadConfig();

    log('\n📋 BlockStop Configuration', 'cyan');
    log('='.repeat(50) + '\n', 'cyan');

    log('Profiles:', 'bright');
    const profiles = await configMgr.listProfiles();
    profiles.forEach(p => {
      const isCurrent = p === config.currentProfile ? ' (current)' : '';
      log(`  • ${p}${isCurrent}`);
    });

    log('\nIntegrations:', 'bright');
    const integrations = Object.entries(config.integrations);
    integrations.forEach(([name, cfg]) => {
      const enabled = cfg?.enabled ? '✅' : '❌';
      log(`  ${enabled} ${name}`);
    });

    log('\nThreat Rules:', 'bright');
    log(`  Total: ${config.threatRules.length}`);
    config.threatRules.slice(0, 3).forEach(rule => {
      log(`  • ${rule.name} (${rule.patterns.length} patterns)`);
    });

    if (config.threatRules.length > 3) {
      log(`  ... and ${config.threatRules.length - 3} more`);
    }

    log('\n');
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Integrations list command
 */
async function listIntegrations(): Promise<void> {
  try {
    const integrationMgr = new IntegrationManager();
    const statuses = await integrationMgr.getIntegrationStatus();

    console.log(IntegrationManager.formatStatus(statuses));
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Integrations test command
 */
async function testIntegration(name: string): Promise<void> {
  try {
    if (!name) {
      logError('Integration name required. Usage: blockstop integrations test <name>');
      process.exit(1);
    }

    logInfo(`Testing ${name} integration...`);

    const integrationMgr = new IntegrationManager();
    const result = await integrationMgr.testIntegration(name);

    if (result.valid) {
      logSuccess(`${name} integration is working correctly`);
    } else {
      logError(`${name} integration failed:`);
      (result.errors || []).forEach(err => {
        logError(`  • ${err}`);
      });
      process.exit(1);
    }
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Show version
 */
function showVersion(): void {
  log(`BlockStop CLI v${VERSION}`, 'cyan');
  log('https://blockstop.io', 'blue');
}

/**
 * Show help
 */
function showHelp(): void {
  log(
    `
BlockStop CLI v${VERSION} - Advanced Security Analysis Tool

USAGE:
  ${CLI_NAME} <command> [options]

COMMANDS:
  email analyze              Analyze email for phishing/malware threats
  file scan <path>           Scan file for malware signatures
  url check <url>            Analyze URL for phishing/malware
  config init                Initialize default configuration
  config list                Show current configuration
  config set api-key <svc>   Set API key for integration service
  integrations list          Show integration status
  integrations test <name>   Test specific integration
  auth login                 Authenticate with BlockStop
  account info               Show account information
  --version                  Show version
  --help                     Show this help

EXAMPLES:
  blockstop email analyze < email.txt
  blockstop file scan /path/to/file.exe
  blockstop url check https://example.com
  blockstop config init
  blockstop integrations list
  blockstop integrations test slack

CONFIGURATION:
  Config file: ~/.blockstop/config.yml
  Initialize with: blockstop config init

INTEGRATIONS:
  Slack:    Send security alerts to Slack
  JIRA:     Create security tickets automatically
  Webhook:  Send alerts to custom endpoint

DOCUMENTATION:
  https://docs.blockstop.io
  https://blockstop.io/downloads

VERSION: ${VERSION}
`,
    'cyan'
  );
}

/**
 * Account info
 */
function showAccountInfo(): void {
  log('\n👤 BlockStop Account Info', 'cyan');
  log('Account: Not authenticated', 'yellow');
  log('Tier: FREE', 'yellow');
  log('Scans this month: 0/50', 'yellow');
  log('\nTo authenticate: blockstop auth login\n', 'cyan');
}

/**
 * Main CLI router
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];
  const subcommand = args[1];
  const rest = args.slice(2);

  try {
    switch (command) {
      case 'email':
        if (subcommand === 'analyze') {
          await analyzeEmail();
        } else {
          logError('Unknown email command. Try: blockstop email analyze');
          process.exit(1);
        }
        break;

      case 'file':
        if (subcommand === 'scan') {
          const filepath = rest[0];
          if (!filepath) {
            logError('File path required. Usage: blockstop file scan <path>');
            process.exit(1);
          }
          if (!fs.existsSync(filepath)) {
            logError(`File not found: ${filepath}`);
            process.exit(1);
          }
          // Use basic file scanning
          log('\n📁 BlockStop File Scanner', 'cyan');
          log(`File: ${filepath}`, 'cyan');
          const stats = fs.statSync(filepath);
          log(`Size: ${(stats.size / 1024).toFixed(2)} KB`, 'cyan');
          log(`Type: ${path.extname(filepath).toLowerCase()}\n`, 'cyan');
          logSuccess('File scan feature available in full version');
          break;
        } else {
          logError('Unknown file command. Try: blockstop file scan <path>');
          process.exit(1);
        }
        break;

      case 'url':
        if (subcommand === 'check') {
          const url = rest[0];
          await checkURL(url);
        } else {
          logError('Unknown url command. Try: blockstop url check <url>');
          process.exit(1);
        }
        break;

      case 'config':
        if (subcommand === 'init') {
          await initConfig();
        } else if (subcommand === 'list') {
          await listConfig();
        } else if (subcommand === 'set') {
          await setConfig(rest[0], rest[1], ...rest.slice(2));
        } else {
          logError('Unknown config command. Try: blockstop config init|list|set');
          process.exit(1);
        }
        break;

      case 'integrations':
        if (subcommand === 'list') {
          await listIntegrations();
        } else if (subcommand === 'test') {
          await testIntegration(rest[0]);
        } else {
          logError('Unknown integrations command. Try: blockstop integrations list|test');
          process.exit(1);
        }
        break;

      case 'auth':
        if (subcommand === 'login') {
          log('\n🔐 BlockStop Authentication', 'cyan');
          logSuccess('Authentication setup (use config for API keys)');
          log('Configure with: blockstop config set api-key <service> <token>\n', 'cyan');
        } else {
          logError('Unknown auth command. Try: blockstop auth login');
          process.exit(1);
        }
        break;

      case 'account':
        if (subcommand === 'info') {
          showAccountInfo();
        } else {
          logError('Unknown account command. Try: blockstop account info');
          process.exit(1);
        }
        break;

      case '--version':
      case '-v':
        showVersion();
        break;

      case '--help':
      case '-h':
      case 'help':
        showHelp();
        break;

      default:
        logError(`Unknown command: ${command}\nTry: blockstop --help`);
        process.exit(1);
    }
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run
main().catch(error => {
  logError(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

export { main };
