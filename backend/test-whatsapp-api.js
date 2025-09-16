#!/usr/bin/env node

/**
 * WhatsApp API Testing Utility
 * 
 * This script helps test your WhatsApp API endpoints with the new access token
 * Usage: node test-whatsapp-api.js [options]
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'qt3yb4Lgty5SjeJeflqEYvdWJy9id8IzpC3Ha4C1M5jtaBomySZFJ4aXQIRN4uN4',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '778806801982541',
  testPhoneNumber: process.env.TEST_PHONE_NUMBER || '1234567890'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Helper function to get auth headers
function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json'
  };
}

async function testConnection() {
  log('\n🔍 Testing WhatsApp Connection', 'blue');
  
  try {
    const url = `${config.baseUrl}/api/whatsapp/test-connection`;
    
    log(`URL: ${url}`, 'yellow');
    
    const response = await axios.get(url, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      log('✅ WhatsApp connection test PASSED', 'green');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
    } else {
      log('❌ WhatsApp connection test FAILED', 'red');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'red');
    }
  } catch (error) {
    log('❌ WhatsApp connection test FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function testGetAllowedRecipients() {
  log('\n📋 Testing Get Allowed Recipients', 'blue');
  
  try {
    const url = `${config.baseUrl}/api/whatsapp/allowed-recipients`;
    
    log(`URL: ${url}`, 'yellow');
    
    const response = await axios.get(url, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      log('✅ Get allowed recipients test PASSED', 'green');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
    } else {
      log('❌ Get allowed recipients test FAILED', 'red');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'red');
    }
  } catch (error) {
    log('❌ Get allowed recipients test FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function testAddRecipient() {
  log('\n➕ Testing Add Recipient', 'blue');
  
  try {
    const url = `${config.baseUrl}/api/whatsapp/allowed-recipients/add`;
    const data = {
      phoneNumber: config.testPhoneNumber
    };
    
    log(`URL: ${url}`, 'yellow');
    log(`Data: ${JSON.stringify(data, null, 2)}`, 'yellow');
    
    const response = await axios.post(url, data, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      log('✅ Add recipient test PASSED', 'green');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
    } else {
      log('❌ Add recipient test FAILED', 'red');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'red');
    }
  } catch (error) {
    log('❌ Add recipient test FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function testSendMessage() {
  log('\n📤 Testing Send Single Message', 'blue');
  
  try {
    const url = `${config.baseUrl}/api/whatsapp/send-message`;
    const data = {
      to: config.testPhoneNumber,
      message: 'Hello! This is a test message from the MR Communication Tool.',
      type: 'text'
    };
    
    log(`URL: ${url}`, 'yellow');
    log(`Data: ${JSON.stringify(data, null, 2)}`, 'yellow');
    
    const response = await axios.post(url, data, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      log('✅ Send message test PASSED', 'green');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
    } else {
      log('❌ Send message test FAILED', 'red');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'red');
    }
  } catch (error) {
    log('❌ Send message test FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function testSendBulkMessages() {
  log('\n📤 Testing Send Bulk Messages', 'blue');
  
  try {
    const url = `${config.baseUrl}/api/whatsapp/send-bulk-messages`;
    const data = {
      messages: [
        {
          to: config.testPhoneNumber,
          message: 'Bulk message 1: Hello from MR Communication Tool!',
          type: 'text'
        },
        {
          to: config.testPhoneNumber,
          message: 'Bulk message 2: This is a test bulk message.',
          type: 'text'
        }
      ]
    };
    
    log(`URL: ${url}`, 'yellow');
    log(`Data: ${JSON.stringify(data, null, 2)}`, 'yellow');
    
    const response = await axios.post(url, data, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      log('✅ Send bulk messages test PASSED', 'green');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
    } else {
      log('❌ Send bulk messages test FAILED', 'red');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'red');
    }
  } catch (error) {
    log('❌ Send bulk messages test FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function testSendToAllRecipients() {
  log('\n📤 Testing Send to All Recipients', 'blue');
  
  try {
    const url = `${config.baseUrl}/api/whatsapp/send-to-all`;
    const data = {
      message: 'Hello all! This is a broadcast message from MR Communication Tool.',
      type: 'text'
    };
    
    log(`URL: ${url}`, 'yellow');
    log(`Data: ${JSON.stringify(data, null, 2)}`, 'yellow');
    
    const response = await axios.post(url, data, {
      headers: getAuthHeaders()
    });
    
    if (response.data.success) {
      log('✅ Send to all recipients test PASSED', 'green');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
    } else {
      log('❌ Send to all recipients test FAILED', 'red');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'red');
    }
  } catch (error) {
    log('❌ Send to all recipients test FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function testWebhookStatus() {
  log('\n🔗 Testing Webhook Status', 'blue');
  
  try {
    const url = `${config.baseUrl}/api/webhook/status`;
    
    log(`URL: ${url}`, 'yellow');
    
    const response = await axios.get(url);
    
    if (response.data.status === 'OK') {
      log('✅ Webhook status test PASSED', 'green');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
    } else {
      log('❌ Webhook status test FAILED', 'red');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'red');
    }
  } catch (error) {
    log('❌ Webhook status test FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function testHealthCheck() {
  log('\n🏥 Testing Health Check', 'blue');
  
  try {
    const url = `${config.baseUrl}/api/health`;
    
    log(`URL: ${url}`, 'yellow');
    
    const response = await axios.get(url);
    
    if (response.data.status === 'OK') {
      log('✅ Health check test PASSED', 'green');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
    } else {
      log('❌ Health check test FAILED', 'red');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'red');
    }
  } catch (error) {
    log('❌ Health check test FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function interactiveTest() {
  const rl = createRL();
  
  log('\n🎯 Interactive WhatsApp API Testing', 'bold');
  log('Choose a test to run:', 'yellow');
  log('1. Test Connection', 'blue');
  log('2. Get Allowed Recipients', 'blue');
  log('3. Add Recipient', 'blue');
  log('4. Send Single Message', 'blue');
  log('5. Send Bulk Messages', 'blue');
  log('6. Send to All Recipients', 'blue');
  log('7. Webhook Status', 'blue');
  log('8. Health Check', 'blue');
  log('9. Run All Tests', 'blue');
  log('10. Exit', 'blue');
  
  return new Promise((resolve) => {
    rl.question('\nEnter your choice (1-10): ', async (choice) => {
      rl.close();
      
      switch (choice) {
        case '1':
          await testConnection();
          break;
        case '2':
          await testGetAllowedRecipients();
          break;
        case '3':
          await testAddRecipient();
          break;
        case '4':
          await testSendMessage();
          break;
        case '5':
          await testSendBulkMessages();
          break;
        case '6':
          await testSendToAllRecipients();
          break;
        case '7':
          await testWebhookStatus();
          break;
        case '8':
          await testHealthCheck();
          break;
        case '9':
          await runAllTests();
          break;
        case '10':
          log('👋 Goodbye!', 'green');
          process.exit(0);
          break;
        default:
          log('❌ Invalid choice. Please enter 1-10.', 'red');
      }
      
      resolve();
    });
  });
}

async function runAllTests() {
  log('\n🚀 Running All WhatsApp API Tests', 'bold');
  
  await testHealthCheck();
  await testWebhookStatus();
  await testConnection();
  await testGetAllowedRecipients();
  await testAddRecipient();
  await testSendMessage();
  await testSendBulkMessages();
  await testSendToAllRecipients();
  
  log('\n✨ All tests completed!', 'green');
}

function showHelp() {
  log('\n📖 WhatsApp API Testing Utility', 'bold');
  log('\nUsage:', 'yellow');
  log('  node test-whatsapp-api.js [options]', 'blue');
  log('\nOptions:', 'yellow');
  log('  --help, -h          Show this help message', 'blue');
  log('  --url <url>         Set API base URL (default: http://localhost:5000)', 'blue');
  log('  --token <token>     Set access token', 'blue');
  log('  --phone <number>    Set test phone number', 'blue');
  log('  --all               Run all tests', 'blue');
  log('  --connection        Test connection only', 'blue');
  log('  --recipients        Test recipients management only', 'blue');
  log('  --send              Test message sending only', 'blue');
  log('  --webhook           Test webhook status only', 'blue');
  log('  --health            Test health check only', 'blue');
  log('\nEnvironment Variables:', 'yellow');
  log('  API_BASE_URL        Base URL for API endpoints', 'blue');
  log('  WHATSAPP_ACCESS_TOKEN  Access token for authentication', 'blue');
  log('  WHATSAPP_PHONE_NUMBER_ID  Phone number ID', 'blue');
  log('  TEST_PHONE_NUMBER   Phone number for testing', 'blue');
  log('\nExamples:', 'yellow');
  log('  node test-whatsapp-api.js --all', 'blue');
  log('  node test-whatsapp-api.js --url https://yourdomain.com --connection', 'blue');
  log('  API_BASE_URL=https://yourdomain.com node test-whatsapp-api.js --all', 'blue');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      case '--url':
        config.baseUrl = args[++i];
        break;
      case '--token':
        config.accessToken = args[++i];
        break;
      case '--phone':
        config.testPhoneNumber = args[++i];
        break;
      case '--all':
        await runAllTests();
        process.exit(0);
        break;
      case '--connection':
        await testConnection();
        process.exit(0);
        break;
      case '--recipients':
        await testGetAllowedRecipients();
        await testAddRecipient();
        process.exit(0);
        break;
      case '--send':
        await testSendMessage();
        await testSendBulkMessages();
        await testSendToAllRecipients();
        process.exit(0);
        break;
      case '--webhook':
        await testWebhookStatus();
        process.exit(0);
        break;
      case '--health':
        await testHealthCheck();
        process.exit(0);
        break;
    }
  }
  
  // If no arguments, run interactive mode
  if (args.length === 0) {
    await interactiveTest();
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`\n❌ Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
