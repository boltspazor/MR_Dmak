#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function testWhatsAppAPI() {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    console.log('🧪 Testing WhatsApp API Integration...');
    console.log('=====================================');
    
    if (!accessToken || !phoneNumberId) {
        console.log('❌ Missing WhatsApp credentials');
        console.log('Access Token:', !!accessToken ? 'Present' : 'Missing');
        console.log('Phone Number ID:', !!phoneNumberId ? 'Present' : 'Missing');
        return;
    }
    
    console.log('✅ WhatsApp credentials found');
    console.log('📱 Phone Number ID:', phoneNumberId);
    console.log('🔑 Access Token Length:', accessToken.length);
    
    // Test 1: Verify access token with Meta API
    try {
        console.log('\n🔍 Testing access token validity...');
        const response = await axios.get('https://graph.facebook.com/v18.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            timeout: 10000
        });
        
        console.log('✅ Access token is valid!');
        console.log('📊 Token info:', response.data);
        
    } catch (error) {
        console.log('❌ Access token test failed:');
        console.log('Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('🔄 Token might be expired. Please get a new one from Meta Developer Console.');
        }
        return;
    }
    
    // Test 2: Test phone number configuration
    try {
        console.log('\n📱 Testing phone number configuration...');
        const response = await axios.get(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            timeout: 10000
        });
        
        console.log('✅ Phone number configuration is valid!');
        console.log('📞 Phone info:', response.data);
        
    } catch (error) {
        console.log('❌ Phone number test failed:');
        console.log('Error:', error.response?.data || error.message);
        return;
    }
    
    console.log('\n🎉 WhatsApp API integration is working correctly!');
    console.log('🚀 Your MR Communication Tool is ready to send messages!');
}

// Run the test
testWhatsAppAPI().catch(console.error);

