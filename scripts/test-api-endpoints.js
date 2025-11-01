/**
 * Simple API Endpoint Test Script
 * 
 * This script tests if the API endpoints are properly configured and accessible.
 * Run with: node scripts/test-api-endpoints.js
 * 
 * Note: This is a basic connectivity test. Full integration tests require authentication.
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

console.log('🧪 Testing API Endpoints...\n');

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
    console.log(`Testing: ${test.name}`);
    console.log(`  URL: ${test.url}`);
    console.log(`  Expected: ${test.expectedStatus} (${test.description})`);
    
    const response = await fetch(test.url, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: test.method === 'POST' ? JSON.stringify({}) : undefined
    });

    const status = response.status;
    const isExpected = status === test.expectedStatus;
    
    console.log(`  Result: ${status} ${isExpected ? '✅' : '❌'}`);
    
    if (!isExpected) {
      const text = await response.text();
      console.log(`  Response: ${text.substring(0, 200)}`);
    }
    
    console.log('');
    return isExpected;
  } catch (error) {
    console.log(`  Result: ERROR ❌`);
    console.log(`  Error: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  console.log(`Base URL: ${API_BASE}\n`);
  console.log('=' .repeat(60) + '\n');

  const results = [];
  for (const test of tests) {
    const passed = await testEndpoint(test);
    results.push({ name: test.name, passed });
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('=' .repeat(60));
  console.log('\n📊 Test Summary:\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 All endpoints are accessible!');
    console.log('\nNote: 401 responses are expected without authentication.');
    console.log('This confirms the endpoints exist and are properly configured.');
  } else {
    console.log('\n⚠️  Some endpoints may not be properly configured.');
    console.log('Check the errors above for details.');
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ or a fetch polyfill.');
  console.error('   Install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});

