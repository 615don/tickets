// Quick manual test for debug endpoint
// Run with: node test-debug-endpoint.js

import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testDebugEndpoint() {
  console.log('Testing debug endpoint...\n');

  try {
    // Test 1: Debug endpoint disabled (default)
    console.log('Test 1: Debug endpoint with DEBUG_SESSIONS=false (should return 404)');
    const response1 = await fetch(`${API_URL}/api/debug/session`);
    console.log(`Status: ${response1.status}`);
    const data1 = await response1.json();
    console.log('Response:', data1);
    console.log(response1.status === 404 ? '✓ PASS\n' : '✗ FAIL\n');

    // Test 2: Instructions for testing with debug mode enabled
    console.log('Test 2: To test with DEBUG_SESSIONS=true:');
    console.log('1. Add DEBUG_SESSIONS=true to backend/.env');
    console.log('2. Restart the backend server');
    console.log('3. Run this test again');
    console.log('4. Expected: 200 status with session info\n');

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nNote: Make sure backend server is running on', API_URL);
  }
}

testDebugEndpoint();
