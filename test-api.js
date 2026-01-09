import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
let testToken = '';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealth() {
  try {
    console.log('\n📋 Testing health endpoint...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check: Server is running');
    return true;
  } catch (error) {
    console.log('❌ Health Check Error:', error.message);
    return false;
  }
}

async function testSignup() {
  try {
    console.log('\n📝 Testing signup...');
    const testEmail = `testuser_${Date.now()}@example.com`;
    
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: testEmail,
      password: 'Test@Pass123',
      name: 'Test User'
    });
    
    console.log('✅ Signup Success!');
    console.log('   Email:', testEmail);
    console.log('   Message:', response.data.message);
    
    if (response.data.token) {
      testToken = response.data.token;
      console.log('   Token received and stored');
    }
    
    return { success: true, email: testEmail, token: response.data.token };
  } catch (error) {
    console.log('❌ Signup Error:', error.response?.data?.message || error.message);
    return { success: false };
  }
}

async function testLogin(email, password) {
  try {
    console.log('\n🔑 Testing login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });
    
    console.log('✅ Login Success!');
    console.log('   Email:', email);
    console.log('   Message:', response.data.message);
    console.log('   Token received:', response.data.token ? 'Yes' : 'No');
    
    testToken = response.data.token;
    return { success: true, token: response.data.token };
  } catch (error) {
    console.log('❌ Login Error:', error.response?.data?.message || error.message);
    return { success: false };
  }
}

async function testGetUser() {
  try {
    console.log('\n👤 Testing get current user...');
    
    if (!testToken) {
      console.log('❌ No token available');
      return { success: false };
    }
    
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('✅ Get User Success!');
    console.log('   User:', response.data);
    return { success: true, user: response.data };
  } catch (error) {
    console.log('❌ Get User Error:', error.response?.data?.message || error.message);
    return { success: false };
  }
}

async function testDuplicateSignup(email) {
  try {
    console.log('\n⚠️  Testing duplicate signup (should fail)...');
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email,
      password: 'Test@Pass456',
      name: 'Another User'
    });
    console.log('❌ Should have failed but succeeded!');
    return { success: false };
  } catch (error) {
    console.log('✅ Duplicate signup correctly rejected:', error.response?.data?.message);
    return { success: true };
  }
}

async function runTests() {
  console.log('\n=====================================');
  console.log('   Win GATE Auth System Test Suite');
  console.log('=====================================');

  // Test 1: Health check
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n⚠️  Backend is not responding. Make sure it\'s running on port 5000');
    return;
  }

  // Test 2: Signup
  const signupResult = await testSignup();
  if (!signupResult.success) {
    console.log('\n❌ Signup failed, cannot continue');
    return;
  }

  await delay(500);

  // Test 3: Login
  const loginResult = await testLogin(signupResult.email, 'Test@Pass123');
  if (!loginResult.success) {
    console.log('\n❌ Login failed');
  }

  await delay(500);

  // Test 4: Get current user
  await testGetUser();

  await delay(500);

  // Test 5: Duplicate signup should fail
  await testDuplicateSignup(signupResult.email);

  console.log('\n=====================================');
  console.log('   Test Suite Complete!');
  console.log('=====================================\n');
}

runTests();
