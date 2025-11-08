/**
 * Simple API Endpoint Test Script
 *
 * This script tests if the API endpoints are properly configured and accessible.
 * Run with: node scripts/test-api-endpoints.js
 *
 * Note: This is a basic connectivity test. Full integration tests require authentication.
 */

const { log } = require('../lib/utils/logger');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

log.info('🧪 Testing API Endpoints...\n');

const tests = [
  {
    name: 'Listing Creation Endpoint (POST)',
    method: 'POST',
    url: `${API_BASE}/api/listings`,
    description: 'Should return 401 (Unauthorized) without auth - confirms endpoint exists',
    expectedStatus: 401
  },
  {
    name: 'Wanted Request Creation Endpoint (POST)',
    method: 'POST',
    url: `${API_BASE}/api/wanted-requests`,
    description: 'Should return 401 (Unauthorized) without auth - confirms endpoint exists',
    expectedStatus: 401
  },
  {
    name: 'Admin Listing Approval (POST)',
    method: 'POST',
    url: `${API_BASE}/api/admin/listings/approve`,
    description: 'Should return 401 (Unauthorized) without auth - confirms endpoint exists',
    expectedStatus: 401
  },
  {
    name: 'Admin Wanted Request Approval (POST)',
    method: 'POST',
    url: `${API_BASE}/api/admin/wanted-requests/approve`,
    description: 'Should return 401 (Unauthorized) without auth - confirms endpoint exists',
    expectedStatus: 401
  }
];

async function testEndpoint(test) {
  try {
    log.info(`Testing: ${test.name}`);
    log.info(`  URL: ${test.url}`);
    log.info(`  Expected: ${test.expectedStatus} (${test.description})`);

    const response = await fetch(test.url, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: test.method === 'POST' ? JSON.stringify({}) : undefined
    });

    const status = response.status;
    const isExpected = status === test.expectedStatus;

    log.info(`  Result: ${status} ${isExpected ? '✅' : '❌'}`);

    if (!isExpected) {
      const text = await response.text();
      log.info(`  Response: ${text.substring(0, 200)}`);
    }

    log.info('');
    return isExpected;
  } catch (error) {
    log.error(`  Result: ERROR ❌`);
    log.error(`  Error: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  log.info(`Base URL: ${API_BASE}\n`);
  log.info('=' .repeat(60) + '\n');

  const results = [];
  for (const test of tests) {
    const passed = await testEndpoint(test);
    results.push({ name: test.name, passed });
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  log.info('=' .repeat(60));
  log.info('\n📊 Test Summary:\n');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    log.info(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });

  log.info(`\n${passed}/${total} tests passed`);

  if (passed === total) {
    log.info('\n🎉 All endpoints are accessible!');
    log.info('\nNote: 401 responses are expected without authentication.');
    log.info('This confirms the endpoints exist and are properly configured.');
  } else {
    log.info('\n⚠️  Some endpoints may not be properly configured.');
    log.info('Check the errors above for details.');
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  log.error('❌ This script requires Node.js 18+ or a fetch polyfill.');
  log.error('   Install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch(error => {
  log.error('❌ Test runner error:', error);
  process.exit(1);
});

