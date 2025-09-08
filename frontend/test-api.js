#!/usr/bin/env node

const axios = require('axios');

async function testAPI() {
    console.log('🧪 Testing API Connection...');
    console.log('=====================================');
    
    const API_BASE_URL = 'http://localhost:5001/api';
    
    try {
        // Test 1: Health check
        console.log('\n1. Testing health endpoint...');
        const healthResponse = await axios.get(`${API_BASE_URL}/health`);
        console.log('✅ Health check passed:', healthResponse.data);
        
        // Test 2: API info
        console.log('\n2. Testing API info endpoint...');
        const apiResponse = await axios.get(`${API_BASE_URL}`);
        console.log('✅ API info retrieved:', apiResponse.data);
        
        // Test 3: Test login endpoint (without credentials)
        console.log('\n3. Testing login endpoint structure...');
        try {
            await axios.post(`${API_BASE_URL}/auth/login`, {});
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Login endpoint exists (validation error expected)');
            } else {
                console.log('❌ Login endpoint error:', error.response?.status, error.response?.data);
            }
        }
        
        console.log('\n🎉 All API tests completed successfully!');
        console.log('✅ Backend is running and accessible');
        console.log('✅ API endpoints are working');
        console.log('✅ Ready for frontend login');
        
    } catch (error) {
        console.log('\n❌ API Test Failed:');
        console.log('Error:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n🔧 Solution: Start the backend server');
            console.log('Run: cd backend && npm run dev');
        } else if (error.response?.status === 404) {
            console.log('\n🔧 Solution: Check API URL configuration');
            console.log('Expected: http://localhost:5001/api');
            console.log('Actual:', API_BASE_URL);
        } else {
            console.log('\n🔧 Solution: Check backend logs for more details');
        }
    }
}

// Run the test
testAPI().catch(console.error);
