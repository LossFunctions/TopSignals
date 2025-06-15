#!/usr/bin/env node
/**
 * debug-ranks.js
 * 
 * A debugging utility to test the Coinbase rank API and verify persistence
 * of historical data. This script makes multiple calls to the API with a delay
 * between them to simulate real usage and verify delta calculations.
 * 
 * Usage:
 *   node debug-ranks.js [--url=http://localhost:3000/api/coinbaseRank] [--calls=3] [--delay=2000]
 */

const fetch = require('node-fetch');
const chalk = require('chalk');

// Default configuration
const config = {
  url: 'http://localhost:3000/api/coinbaseRank',
  calls: 3,
  delay: 2000, // 2 seconds between calls
};

// Parse command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--url=')) {
    config.url = arg.substring(6);
  } else if (arg.startsWith('--calls=')) {
    config.calls = parseInt(arg.substring(8), 10);
  } else if (arg.startsWith('--delay=')) {
    config.delay = parseInt(arg.substring(8), 10);
  }
});

// Helper to format rank data with colors
function formatRank(current, prev, delta) {
  let output = chalk.bold(`#${current ?? '—'}`);
  
  if (prev !== null && prev !== undefined) {
    output += ` (prev: #${prev})`;
  }
  
  if (delta !== null && delta !== undefined) {
    const color = delta > 0 ? chalk.green : delta < 0 ? chalk.red : chalk.gray;
    const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
    const sign = delta > 0 ? '+' : '';
    output += ` ${color(`${arrow} ${sign}${delta}`)}`;
  }
  
  return output;
}

// Check for environment variables
function checkEnvironment() {
  console.log(chalk.cyan('🔍 Checking environment variables...'));
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log(chalk.yellow('⚠️  Missing environment variables:'));
    missing.forEach(varName => {
      console.log(chalk.yellow(`   - ${varName}`));
    });
    console.log(chalk.yellow('These should be set in .env.local for local development.'));
  } else {
    console.log(chalk.green('✅ All required environment variables are set.'));
  }
  
  return missing.length === 0;
}

// Make a single API call
async function callApi(url, attempt = 1) {
  console.log(chalk.cyan(`\n📡 API Call #${attempt} to ${url}`));
  
  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      console.log(chalk.red(`❌ Error: HTTP ${response.status}`));
      const text = await response.text();
      console.log(chalk.red(text));
      return null;
    }
    
    const data = await response.json();
    console.log(chalk.green(`✅ Success (${elapsed}ms)`));
    return data;
  } catch (error) {
    console.log(chalk.red(`❌ Exception: ${error.message}`));
    return null;
  }
}

// Display the API response
function displayResult(data) {
  if (!data) {
    console.log(chalk.red('No data to display.'));
    return;
  }
  
  console.log('\n📊 Results:');
  console.log(chalk.cyan('Finance Category Rank:'), 
    formatRank(data.financeRank, data.prevFinanceRank, data.deltaFinance));
  
  console.log(chalk.cyan('Overall App Rank:   '), 
    formatRank(data.overallRank, data.prevOverallRank, data.deltaOverall));
  
  console.log('\n📝 Additional Info:');
  console.log(chalk.cyan('Data Source:'), data.source || 'unknown');
  console.log(chalk.cyan('Stale Data:'), data.stale ? chalk.yellow('YES') : chalk.green('NO'));
  
  if (data.scraperReason) {
    console.log(chalk.cyan('Scraper Reason:'), data.scraperReason);
  }
  
  // Check for database issues
  if (data.prevFinanceRank === null && data.prevOverallRank === null) {
    if (data.financeRank !== null || data.overallRank !== null) {
      console.log(chalk.yellow('\n⚠️  No previous rank data found. Possible causes:'));
      console.log(chalk.yellow('   - This is the first API call (no historical data yet)'));
      console.log(chalk.yellow('   - The Supabase table doesn\'t exist (run migration)'));
      console.log(chalk.yellow('   - Database operations are failing (check SUPABASE_SERVICE_ROLE_KEY)'));
    }
  }
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function
async function main() {
  console.log(chalk.bold.cyan('🚀 Coinbase Rank API Debugger'));
  console.log(chalk.cyan(`URL: ${config.url}`));
  console.log(chalk.cyan(`Calls: ${config.calls}`));
  console.log(chalk.cyan(`Delay: ${config.delay}ms`));
  
  checkEnvironment();
  
  for (let i = 1; i <= config.calls; i++) {
    const data = await callApi(config.url, i);
    displayResult(data);
    
    if (i < config.calls) {
      console.log(chalk.cyan(`\n⏳ Waiting ${config.delay}ms before next call...`));
      await sleep(config.delay);
    }
  }
  
  console.log(chalk.bold.green('\n✅ Debug session complete!'));
}

// Run the script
main().catch(error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});
