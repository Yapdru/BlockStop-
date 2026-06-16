#!/usr/bin/env node

/**
 * BlockStop Plugin CLI
 * Command-line tool for developing, validating, and publishing plugins
 */

const fs = require('fs');
const path = require('path');

const createCommand = require('./commands/create');
const validateCommand = require('./commands/validate');
const testCommand = require('./commands/test');
const submitCommand = require('./commands/submit');

const VERSION = '1.0.0';

class PluginCLI {
  constructor() {
    this.commands = {
      create: createCommand,
      validate: validateCommand,
      test: testCommand,
      submit: submitCommand,
    };
  }

  printHelp() {
    console.log(`
BlockStop Plugin CLI v${VERSION}

Usage: blockstop-plugin <command> [options]

Commands:
  create <name>              Create a new plugin from template
  validate [path]            Validate plugin manifest
  test [path]                Run plugin tests
  submit [path]              Submit plugin to marketplace

Options:
  -h, --help                 Show this help message
  -v, --version              Show version
  --template <name>          Specify template (for create command)
  --output <path>            Specify output directory
  --type <type>              Specify plugin type
  --author <name>            Specify author name
  --license <license>        Specify license
  --token <token>            API token for submission
  --dry-run                  Run without making changes

Examples:
  blockstop-plugin create my-plugin
  blockstop-plugin create my-plugin --template threat-enrichment
  blockstop-plugin validate .
  blockstop-plugin test .
  blockstop-plugin submit . --token YOUR_API_TOKEN

For more information, visit: https://docs.blockstop.io/plugin-dev
    `);
  }

  printVersion() {
    console.log(`BlockStop Plugin CLI v${VERSION}`);
  }

  parseArgs(args) {
    const parsed = {
      command: null,
      args: [],
      options: {},
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith('-')) {
        const key = arg.replace(/^-+/, '');
        const value = args[i + 1];

        if (value && !value.startsWith('-')) {
          parsed.options[key] = value;
          i++;
        } else {
          parsed.options[key] = true;
        }
      } else if (!parsed.command) {
        parsed.command = arg;
      } else {
        parsed.args.push(arg);
      }
    }

    return parsed;
  }

  async run(args) {
    const parsed = this.parseArgs(args);

    if (parsed.options.help || parsed.options.h) {
      this.printHelp();
      return;
    }

    if (parsed.options.version || parsed.options.v) {
      this.printVersion();
      return;
    }

    if (!parsed.command) {
      console.error('No command specified');
      this.printHelp();
      process.exit(1);
    }

    if (!this.commands[parsed.command]) {
      console.error(`Unknown command: ${parsed.command}`);
      this.printHelp();
      process.exit(1);
    }

    try {
      const command = this.commands[parsed.command];
      await command.execute(parsed.args, parsed.options);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      if (parsed.options.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
}

// Main execution
if (require.main === module) {
  const cli = new PluginCLI();
  cli.run(process.argv.slice(2)).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = PluginCLI;
