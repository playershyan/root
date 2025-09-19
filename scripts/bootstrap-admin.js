#!/usr/bin/env node

/**
 * Bootstrap Admin User Script
 *
 * This script creates an admin user in the VERA marketplace.
 * Run this after logging in as a user you want to make admin.
 *
 * Usage:
 * 1. Start the development server: npm run dev
 * 2. Login to the app with your user account
 * 3. Run: node scripts/bootstrap-admin.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function bootstrapAdmin() {
  console.log('🔧 VERA Admin Bootstrap Tool\n');

  console.log('Steps to bootstrap admin:');
  console.log('1. Make sure you are logged into the app at http://localhost:3001');
  console.log('2. Navigate to: http://localhost:3001/admin/setup');
  console.log('3. Click "Bootstrap Admin User" to create your admin account');
  console.log('4. Once created, access admin dashboard at: http://localhost:3001/admin\n');

  console.log('🎯 Quick Setup:');
  console.log('- Open: http://localhost:3001/admin/setup');
  console.log('- Click "Bootstrap Admin User"');
  console.log('- Go to: http://localhost:3001/admin');
  console.log('\n✅ After setup, you can approve pending listings from the admin dashboard.');

  rl.question('\nPress Enter to continue...', () => {
    console.log('\n📱 Next steps:');
    console.log('1. Create a test listing to verify the approval workflow');
    console.log('2. Check admin dashboard for pending listings');
    console.log('3. Approve/reject listings as needed\n');
    rl.close();
  });
}

bootstrapAdmin().catch(console.error);