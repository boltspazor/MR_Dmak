// Test script to verify campaigns API endpoint
const axios = require('axios');

const API_BASE_URL = 'https://mrbackend-production-2ce3.up.railway.app/api';

async function testCampaignsAPI() {
  console.log('🧪 Testing Campaigns API Endpoint...');
  console.log('📍 API Base URL:', API_BASE_URL);
  
  try {
    // Test health endpoint first
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test campaigns endpoint
    console.log('\n2. Testing campaigns endpoint...');
    const campaignsResponse = await axios.get(`${API_BASE_URL}/messages/campaigns`);
    console.log('✅ Campaigns endpoint working:', campaignsResponse.data);
    
    // Test if old endpoint still exists (should return 404)
    console.log('\n3. Testing old campaigns endpoint (should fail)...');
    try {
      await axios.get(`${API_BASE_URL}/campaigns`);
      console.log('❌ Old endpoint still exists - this should not happen!');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Old endpoint correctly returns 404');
      } else {
        console.log('⚠️  Old endpoint error:', error.response?.status, error.message);
      }
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testCampaignsAPI();
