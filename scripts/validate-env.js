#!/usr/bin/env node

/**
 * This script validates the environment variables required for the application.
 * Run it before starting the application to ensure all necessary configuration is present.
 */

require('dotenv').config({ path: '.env.local' });

const chalk = require('chalk');

// Define required and optional environment variables
const requiredVars = [
  'GOOGLE_PROJECT_ID',
  'GOOGLE_LOCATION',
  'HEALTHCARE_DATASET',
  'FHIR_STORE',
  'DEMO_SECRET'
];

const optionalVars = [
  'GOOGLE_APPLICATION_CREDENTIALS',
  'ONCOKB_API_KEY',
  'GCP_VERTEX_LOCATION',
  'GEMINI_MODEL'
];

// Check environment variables
const missingRequired = [];
const missingOptional = [];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingRequired.push(varName);
  }
});

optionalVars.forEach(varName => {
  if (!process.env[varName]) {
    missingOptional.push(varName);
  }
});

// Display results
console.log(chalk.bold('\nOncoFHIR Lens - Environment Validation\n'));

if (missingRequired.length === 0) {
  console.log(chalk.green('✓ All required environment variables are set.\n'));
} else {
  console.log(chalk.red(`✗ Missing ${missingRequired.length} required environment variables:\n`));
  missingRequired.forEach(varName => {
    console.log(chalk.red(`  - ${varName}`));
  });
  console.log('');
}

if (missingOptional.length === 0) {
  console.log(chalk.green('✓ All optional environment variables are set.\n'));
} else {
  console.log(chalk.yellow(`ℹ Missing ${missingOptional.length} optional environment variables:\n`));
  missingOptional.forEach(varName => {
    console.log(chalk.yellow(`  - ${varName}`));
  });
  console.log('');
}

// Check specific combinations
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log(chalk.yellow('ℹ GOOGLE_APPLICATION_CREDENTIALS not set. Application Default Credentials will be used.'));
}

if (!process.env.ONCOKB_API_KEY) {
  console.log(chalk.yellow('ℹ ONCOKB_API_KEY not set. OncoKB annotation will not be available.'));
}

if (!process.env.GCP_VERTEX_LOCATION || !process.env.GEMINI_MODEL) {
  console.log(chalk.yellow('ℹ Gemini AI configuration incomplete. AI-assisted suggestions will not be available.'));
}

console.log('');

// Exit with error code if required variables are missing
if (missingRequired.length > 0) {
  console.log(chalk.red('Please set the required environment variables before starting the application.'));
  process.exit(1);
} else {
  console.log(chalk.green('Environment validation passed. The application can start.'));
  process.exit(0);
}
