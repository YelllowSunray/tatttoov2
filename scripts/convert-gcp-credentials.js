#!/usr/bin/env node

/**
 * Helper script to convert GCP service account JSON key to .env.local format
 * 
 * Usage:
 *   node scripts/convert-gcp-credentials.js path/to/your-key.json
 * 
 * This will output the credentials in a format ready to paste into .env.local
 */

const fs = require('fs');
const path = require('path');

// Get the JSON file path from command line arguments
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('❌ Error: Please provide the path to your GCP service account JSON key file');
  console.log('\nUsage:');
  console.log('  node scripts/convert-gcp-credentials.js path/to/your-key.json');
  console.log('\nExample:');
  console.log('  node scripts/convert-gcp-credentials.js ./my-gcp-key.json');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(jsonFilePath)) {
  console.error(`❌ Error: File not found: ${jsonFilePath}`);
  process.exit(1);
}

try {
  // Read and parse the JSON file
  const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
  const credentials = JSON.parse(jsonContent);

  // Extract project ID
  const projectId = credentials.project_id;

  if (!projectId) {
    console.error('❌ Error: JSON file does not contain project_id');
    process.exit(1);
  }

  // Convert JSON to single line (minified)
  const minifiedJson = JSON.stringify(credentials);

  console.log('\n✅ Successfully converted GCP credentials!\n');
  console.log('📋 Copy these lines to your .env.local file:\n');
  console.log('─'.repeat(60));
  console.log(`GOOGLE_CLOUD_PROJECT_ID=${projectId}`);
  console.log('GOOGLE_CLOUD_LOCATION=us-central1');
  console.log(`GOOGLE_CLOUD_CREDENTIALS=${minifiedJson}`);
  console.log('─'.repeat(60));
  console.log('\n💡 Tip: Make sure to restart your development server after updating .env.local\n');

} catch (error) {
  console.error('❌ Error processing JSON file:');
  console.error(error.message);
  process.exit(1);
}

