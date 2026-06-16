#!/usr/bin/env node

/**
 * Performance Audit Script
 * Automated performance analysis and reporting
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * Math.pow(10, dm)) / Math.pow(10, dm) + ' ' + sizes[i];
}

/**
 * Get status icon based on threshold
 */
function getStatusIcon(value, threshold, inverse = false) {
  const isGood = inverse ? value <= threshold : value >= threshold;
  return isGood ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
}

/**
 * Analyze JavaScript bundle
 */
async function analyzeJSBundle() {
  console.log(`\n${colors.cyan}=== JavaScript Bundle Analysis ===${colors.reset}\n`);

  const bundlePath = path.join(process.cwd(), '.next');
  if (!fs.existsSync(bundlePath)) {
    console.log('Next.js build directory not found. Run "npm run build" first.');
    return;
  }

  const staticPath = path.join(bundlePath, 'static', 'chunks');
  if (!fs.existsSync(staticPath)) {
    console.log('No chunks found.');
    return;
  }

  const files = fs.readdirSync(staticPath).filter((f) => f.endsWith('.js'));
  let totalSize = 0;
  const chunks = [];

  files.forEach((file) => {
    const filePath = path.join(staticPath, file);
    const stats = fs.statSync(filePath);
    const size = stats.size;
    totalSize += size;
    chunks.push({ name: file, size });
  });

  chunks.sort((a, b) => b.size - a.size);

  console.log(`Total JS Bundle: ${colors.blue}${formatBytes(totalSize)}${colors.reset}`);
  console.log(`Number of chunks: ${chunks.length}\n`);

  console.log('Top 10 largest chunks:');
  chunks.slice(0, 10).forEach((chunk, i) => {
    const status = getStatusIcon(chunk.size, 100 * 1024, true); // warn if > 100KB
    console.log(`${i + 1}. ${chunk.name} - ${formatBytes(chunk.size)} ${status}`);
  });

  // Performance budget check
  const budget = 300 * 1024; // 300KB
  const budgetStatus =
    totalSize <= budget
      ? `${colors.green}✓ WITHIN BUDGET${colors.reset}`
      : `${colors.red}✗ EXCEEDS BUDGET${colors.reset}`;
  console.log(`\nBudget (300KB): ${budgetStatus}`);
}

/**
 * Analyze CSS bundle
 */
async function analyzeCSSBundle() {
  console.log(`\n${colors.cyan}=== CSS Bundle Analysis ===${colors.reset}\n`);

  const cssPath = path.join(process.cwd(), '.next', 'static', 'css');
  if (!fs.existsSync(cssPath)) {
    console.log('No CSS files found.');
    return;
  }

  const files = fs.readdirSync(cssPath).filter((f) => f.endsWith('.css'));
  let totalSize = 0;
  const sheets = [];

  files.forEach((file) => {
    const filePath = path.join(cssPath, file);
    const stats = fs.statSync(filePath);
    const size = stats.size;
    totalSize += size;
    sheets.push({ name: file, size });
  });

  sheets.sort((a, b) => b.size - a.size);

  console.log(`Total CSS Bundle: ${colors.blue}${formatBytes(totalSize)}${colors.reset}`);
  console.log(`Number of stylesheets: ${sheets.length}\n`);

  if (sheets.length > 0) {
    console.log('CSS files:');
    sheets.forEach((sheet, i) => {
      console.log(`${i + 1}. ${sheet.name} - ${formatBytes(sheet.size)}`);
    });
  }

  // Performance budget check
  const budget = 50 * 1024; // 50KB
  const budgetStatus =
    totalSize <= budget
      ? `${colors.green}✓ WITHIN BUDGET${colors.reset}`
      : `${colors.yellow}⚠ CONSIDER OPTIMIZATION${colors.reset}`;
  console.log(`\nBudget (50KB): ${budgetStatus}`);
}

/**
 * Check image optimization
 */
async function checkImageOptimization() {
  console.log(`\n${colors.cyan}=== Image Optimization Analysis ===${colors.reset}\n`);

  const publicPath = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicPath)) {
    console.log('Public directory not found.');
    return;
  }

  const walkDir = (dir) => {
    const images = [];
    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        images.push(...walkDir(fullPath));
      } else if (/\.(jpg|jpeg|png|gif|webp|avif)$/i.test(item)) {
        images.push({
          name: path.relative(publicPath, fullPath),
          size: stats.size,
          ext: path.extname(item).toLowerCase(),
        });
      }
    });

    return images;
  };

  const images = walkDir(publicPath);
  if (images.length === 0) {
    console.log('No images found in public directory.');
    return;
  }

  const pngJpgImages = images.filter((img) => img.ext === '.png' || img.ext === '.jpg' || img.ext === '.jpeg');
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);

  console.log(`Total images found: ${images.length}`);
  console.log(`Total image size: ${colors.blue}${formatBytes(totalSize)}${colors.reset}\n`);

  console.log('Optimization Recommendations:');
  if (pngJpgImages.length > 0) {
    console.log(`${colors.yellow}⚠ Found ${pngJpgImages.length} PNG/JPG images${colors.reset}`);
    console.log(`  Consider converting to AVIF or WebP for better compression`);
  }

  const webpImages = images.filter((img) => img.ext === '.webp');
  const avifImages = images.filter((img) => img.ext === '.avif');

  if (webpImages.length > 0) {
    console.log(`${colors.green}✓ ${webpImages.length} WebP images found${colors.reset}`);
  }
  if (avifImages.length > 0) {
    console.log(`${colors.green}✓ ${avifImages.length} AVIF images found${colors.reset}`);
  }

  // Show largest images
  console.log('\nLargest images:');
  images
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .forEach((img, i) => {
      const largeWarning = img.size > 500 * 1024 ? ` ${colors.yellow}(>500KB)${colors.reset}` : '';
      console.log(`${i + 1}. ${img.name} - ${formatBytes(img.size)}${largeWarning}`);
    });
}

/**
 * Check code splitting opportunities
 */
async function checkCodeSplitting() {
  console.log(`\n${colors.cyan}=== Code Splitting Analysis ===${colors.reset}\n`);

  const chunksPath = path.join(process.cwd(), '.next', 'static', 'chunks');
  if (!fs.existsSync(chunksPath)) {
    console.log('No chunks found.');
    return;
  }

  const files = fs.readdirSync(chunksPath).filter((f) => f.endsWith('.js'));
  const mainChunks = files.filter((f) => !f.includes('_'));
  const dynamicChunks = files.filter((f) => f.includes('_'));

  console.log(`Main chunks: ${mainChunks.length}`);
  console.log(`Dynamic chunks: ${dynamicChunks.length}`);

  if (mainChunks.length > 5) {
    console.log(
      `${colors.yellow}⚠ Consider reducing number of main chunks (currently ${mainChunks.length})${colors.reset}`
    );
  }

  if (dynamicChunks.length < 3) {
    console.log(`${colors.yellow}⚠ Consider more code splitting for better caching${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Good code splitting detected${colors.reset}`);
  }
}

/**
 * Check Next.js configuration
 */
function checkNextConfig() {
  console.log(`\n${colors.cyan}=== Next.js Configuration Analysis ===${colors.reset}\n`);

  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (!fs.existsSync(nextConfigPath)) {
    console.log(`${colors.yellow}⚠ next.config.js not found${colors.reset}`);
    console.log('Consider creating one to enable performance optimizations');
    return;
  }

  const configContent = fs.readFileSync(nextConfigPath, 'utf8');
  const checks = {
    swcMinify: configContent.includes('swcMinify'),
    productionBrowserSourceMaps: configContent.includes('productionBrowserSourceMaps'),
    compress: configContent.includes('compress'),
    optimizeFonts: configContent.includes('optimizeFonts'),
    images: configContent.includes('images'),
  };

  console.log('Configuration settings:');
  Object.entries(checks).forEach(([key, found]) => {
    const icon = found ? `${colors.green}✓${colors.reset}` : `${colors.yellow}✗${colors.reset}`;
    console.log(`${icon} ${key}`);
  });
}

/**
 * Generate performance report
 */
async function generateReport() {
  console.log(`\n${colors.cyan}${colors.green}=== BlockStop Performance Audit ===${colors.reset}\n`);
  console.log(`Generated at: ${new Date().toISOString()}\n`);

  await analyzeJSBundle();
  await analyzeCSSBundle();
  await checkImageOptimization();
  await checkCodeSplitting();
  checkNextConfig();

  console.log(`\n${colors.cyan}=== Performance Recommendations ===${colors.reset}\n`);
  console.log('1. Monitor Core Web Vitals:');
  console.log(`   - Largest Contentful Paint (LCP) < ${colors.green}2.5s${colors.reset}`);
  console.log(`   - First Contentful Paint (FCP) < ${colors.green}1.5s${colors.reset}`);
  console.log(`   - Cumulative Layout Shift (CLS) < ${colors.green}0.1${colors.reset}`);
  console.log('\n2. Optimize images:');
  console.log('   - Use AVIF and WebP formats');
  console.log('   - Implement lazy loading');
  console.log('   - Generate responsive images');
  console.log('\n3. Improve code splitting:');
  console.log('   - Split code by route');
  console.log('   - Prefetch critical chunks');
  console.log('\n4. Enable caching strategies:');
  console.log('   - Implement stale-while-revalidate');
  console.log('   - Cache API responses');
  console.log('   - Use service workers');
  console.log(`\n${colors.green}Audit complete!${colors.reset}\n`);
}

// Run audit
generateReport().catch((error) => {
  console.error(`${colors.red}Audit failed:${colors.reset}`, error);
  process.exit(1);
});
