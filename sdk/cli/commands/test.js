/**
 * Test Command
 * Runs plugin tests
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function execute(args, options) {
  const pluginPath = args[0] || '.';

  // Check if jest is available
  try {
    execSync('npm list jest', { cwd: pluginPath, stdio: 'pipe' });
  } catch {
    console.error('Error: Jest is not installed');
    console.log('\nTo install Jest, run:');
    console.log('  npm install --save-dev jest @types/jest ts-jest');
    process.exit(1);
  }

  // Check for test directory
  const testDir = path.join(pluginPath, '__tests__');
  if (!fs.existsSync(testDir)) {
    console.warn('⚠️  No __tests__ directory found');
    console.log('Create tests in __tests__/ directory');
    return;
  }

  try {
    console.log('🧪 Running plugin tests...\n');

    const testArgs = [
      '--testPathPattern=__tests__',
      '--passWithNoTests',
    ];

    if (options.coverage) {
      testArgs.push('--coverage');
    }

    if (options.watch) {
      testArgs.push('--watch');
    }

    const command = `npm test -- ${testArgs.join(' ')}`;
    execSync(command, { cwd: pluginPath, stdio: 'inherit' });

    console.log('\n✓ Tests completed');
  } catch (error) {
    console.error('\n✗ Tests failed');
    process.exit(1);
  }
}

module.exports = { execute };
