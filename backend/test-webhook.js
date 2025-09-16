#!/usr/bin/env node

/**
 * WhatsApp Webhook Testing Utility
 * 
 * This script helps test your WhatsApp webhook endpoints
 * Usage: node test-webhook.js [options]
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const config = {
  baseUrl: process.env.WEBHOOK_BASE_URL || 'http://localhost:5000',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'token1234',
  testChallenge: 'test_challenge_12345'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

async function testWebhookVerification() {
  log('\n🔍 Testing Webhook Verification (GET /api/webhook)', 'blue');
  
  try {
    const url = `${config.baseUrl}/api/webhook`;
    const params = {
      'hub.mode': 'subscribe',
      'hub.verify_token': config.verifyToken,
      'hub.challenge': config.testChallenge
    };
    
    log(`URL: ${url}`, 'yellow');
    log(`Params: ${JSON.stringify(params, null, 2)}`, 'yellow');
    
    const response = await axios.get(url, { params });
    
    if (response.data === config.testChallenge) {
      log('✅ Webhook verification test PASSED', 'green');
      log(`Response: ${response.data}`, 'green');
    } else {
      log('❌ Webhook verification test FAILED', 'red');
      log(`Expected: ${config.testChallenge}`, 'red');
      log(`Received: ${response.data}`, 'red');
    }
  } catch (error) {
    log('❌ Webhook verification test FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function testWebhookEvent() {
  log('\n📨 Testing Webhook Event Processing (POST /api/webhook)', 'blue');
  
  const testEvent = {
    object: "whatsapp_business_account",
    entry: [{
      id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "1234567890",
            phone_number_id: "778806801982541"
          },
          statuses: [{
            id: "wamid.test_message_123",
            status: "delivered",
            timestamp: Math.floor(Date.now() / 1000).toString(),
            recipient_id: "1234567890"
          }]
        },
        field: "messages"
      }]
    }]
  };
  
  try {
    const url = `${config.baseUrl}/api/webhook`;
    
    log(`URL: ${url}`, 'yellow');
    log(`Payload: ${JSON.stringify(testEvent, null, 2)}`, 'yellow');
    
    const response = await axios.post(url, testEvent, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data === 'OK') {
      log('✅ Webhook event processing test PASSED', 'green');
      log(`Response: ${response.data}`, 'green');
    } else {
      log('❌ Webhook event processing test FAILED', 'red');
      log(`Status: ${response.status}`, 'red');
      log(`Response: ${response.data}`, 'red');
    }
  } catch (error) {
    log('❌ Webhook event processing test FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

async function testIncomingMessage() {
  log('\n💬 Testing Incoming Message Processing', 'blue');
  
  const incomingMessage = {
    object: "whatsapp_business_account",
    entry: [{
      id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "1234567890",
            phone_number_id: "778806801982541"
          },
          messages: [{
            from: "1234567890",
            id: "wamid.incoming_message_123",
            timestamp: Math.floor(Date.now() / 1000).toString(),
            text: {
              body: "Hello, this is a test message!"
            },
            type: "text"
          }]
        },
        field: "messages"
      }]
    }]
  };
  
  try {
    const url = `${config.baseUrl}/api/webhook`;
    
    log(`URL: ${url}`, 'yellow');
    log(`Payload: ${JSON.stringify(incomingMessage, null, 2)}`, 'yellow');
    
    const response = await axios.post(url, incomingMessage, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data === 'OK') {
      log('✅ Incoming message processing test PASSED', 'green');
      log(`Response: ${response.data}`, 'green');
    } else {
      log('❌ Incoming message processing test FAILED', 'red');
      log(`Status: ${response.status}`, 'red');
      log(`Response: ${response.data}`, 'red');
    }
  } catch (error) {
    log('❌ Incoming message processing test FAILED', 'red');
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
    
    if (response.status === 200) {
      log('✅ Health check test PASSED', 'green');
      log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
    } else {
      log('❌ Health check test FAILED', 'red');
      log(`Status: ${response.status}`, 'red');
    }
  } catch (error) {
    log('❌ Health check test FAILED', 'red');
    log(`Error: ${error.message}`, 'red');
  }
}

async function interactiveTest() {
  const rl = createRL();
  
  log('\n🎯 Interactive Webhook Testing', 'bold');
  log('Choose a test to run:', 'yellow');
  log('1. Webhook Verification (GET)', 'blue');
  log('2. Webhook Event Processing (POST)', 'blue');
  log('3. Incoming Message Processing', 'blue');
  log('4. Health Check', 'blue');
  log('5. Run All Tests', 'blue');
  log('6. Exit', 'blue');
  
  return new Promise((resolve) => {
    rl.question('\nEnter your choice (1-6): ', async (choice) => {
      rl.close();
      
      switch (choice) {
        case '1':
          await testWebhookVerification();
          break;
        case '2':
          await testWebhookEvent();
          break;
        case '3':
          await testIncomingMessage();
          break;
        case '4':
          await testHealthCheck();
          break;
        case '5':
          await runAllTests();
          break;
        case '6':
          log('👋 Goodbye!', 'green');
          process.exit(0);
          break;
        default:
          log('❌ Invalid choice. Please enter 1-6.', 'red');
      }
      
      resolve();
    });
  });
}

async function runAllTests() {
  log('\n🚀 Running All Webhook Tests', 'bold');
  
  await testHealthCheck();
  await testWebhookVerification();
  await testWebhookEvent();
  await testIncomingMessage();
  
  log('\n✨ All tests completed!', 'green');
}

function showHelp() {
  log('\n📖 WhatsApp Webhook Testing Utility', 'bold');
  log('\nUsage:', 'yellow');
  log('  node test-webhook.js [options]', 'blue');
  log('\nOptions:', 'yellow');
  log('  --help, -h          Show this help message', 'blue');
  log('  --url <url>         Set webhook base URL (default: http://localhost:5000)', 'blue');
  log('  --token <token>     Set verify token (default: token1234)', 'blue');
  log('  --all               Run all tests', 'blue');
  log('  --verification      Run verification test only', 'blue');
  log('  --event             Run event processing test only', 'blue');
  log('  --message           Run incoming message test only', 'blue');
  log('  --health            Run health check test only', 'blue');
  log('\nEnvironment Variables:', 'yellow');
  log('  WEBHOOK_BASE_URL    Base URL for webhook endpoints', 'blue');
  log('  WHATSAPP_VERIFY_TOKEN  Verify token for webhook verification', 'blue');
  log('\nExamples:', 'yellow');
  log('  node test-webhook.js --all', 'blue');
  log('  node test-webhook.js --url https://yourdomain.com --verification', 'blue');
  log('  WEBHOOK_BASE_URL=https://yourdomain.com node test-webhook.js --all', 'blue');
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
        config.verifyToken = args[++i];
        break;
      case '--all':
        await runAllTests();
        process.exit(0);
        break;
      case '--verification':
        await testWebhookVerification();
        process.exit(0);
        break;
      case '--event':
        await testWebhookEvent();
        process.exit(0);
        break;
      case '--message':
        await testIncomingMessage();
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
