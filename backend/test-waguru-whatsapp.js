const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_PHONE_NUMBER = '+919704991147'; // Replace with your WhatsApp number for testing

async function testWaguruWhatsApp() {
  console.log('🧪 Testing Waguru WhatsApp Integration\n');

  try {
    // Test 1: Check connection status
    console.log('1️⃣ Testing connection status...');
    const connectionResponse = await axios.get(`${API_BASE_URL}/whatsapp/test-connection`);
    console.log('✅ Connection Status:', connectionResponse.data);
    console.log('');

    // Test 2: Send a single text message
    console.log('2️⃣ Testing single text message...');
    const textMessageResponse = await axios.post(`${API_BASE_URL}/whatsapp/send`, {
      to: TEST_PHONE_NUMBER,
      message: 'Hello! This is a test message from Waguru WhatsApp API. 🚀',
      type: 'text'
    });
    console.log('✅ Text Message Response:', textMessageResponse.data);
    console.log('');

    // Test 3: Send a test template message
    console.log('3️⃣ Testing template message...');
    const templateResponse = await axios.post(`${API_BASE_URL}/whatsapp/test-template`, {
      phoneNumber: TEST_PHONE_NUMBER,
      templateName: 'hello_world',
      languageCode: 'en_US'
    });
    console.log('✅ Template Message Response:', templateResponse.data);
    console.log('');

    // Test 4: Send bulk messages
    console.log('4️⃣ Testing bulk messages...');
    const bulkMessages = [
      {
        to: TEST_PHONE_NUMBER,
        message: 'Bulk message 1: Testing Waguru integration',
        type: 'text'
      },
      {
        to: TEST_PHONE_NUMBER,
        message: 'Bulk message 2: This is the second message',
        type: 'text'
      }
    ];
    
    const bulkResponse = await axios.post(`${API_BASE_URL}/whatsapp/send-bulk`, {
      messages: bulkMessages
    });
    console.log('✅ Bulk Messages Response:', bulkResponse.data);
    console.log('');

    // Test 5: Test allowed recipients management
    console.log('5️⃣ Testing allowed recipients management...');
    
    // Add a recipient
    const addRecipientResponse = await axios.post(`${API_BASE_URL}/whatsapp/allowed-recipients/add`, {
      phoneNumber: TEST_PHONE_NUMBER
    });
    console.log('✅ Add Recipient Response:', addRecipientResponse.data);
    
    // Get all recipients
    const getRecipientsResponse = await axios.get(`${API_BASE_URL}/whatsapp/allowed-recipients`);
    console.log('✅ Get Recipients Response:', getRecipientsResponse.data);
    console.log('');

    // Test 6: Send message to all recipients
    console.log('6️⃣ Testing send to all recipients...');
    const sendToAllResponse = await axios.post(`${API_BASE_URL}/whatsapp/send-to-all`, {
      message: 'This is a test message sent to all allowed recipients via Waguru! 📱',
      type: 'text'
    });
    console.log('✅ Send to All Response:', sendToAllResponse.data);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('📱 Check your WhatsApp to see the test messages.');
    console.log('💡 Waguru API can send messages to any number without sandbox restrictions!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure you are logged in and have a valid JWT token.');
      console.log('   You can get a token by logging in through the frontend or API.');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tip: Make sure the backend server is running on port 5000.');
      console.log('   Run: npm run dev');
    }
  }
}

// Run the test
testWaguruWhatsApp();
