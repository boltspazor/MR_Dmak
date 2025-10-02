// Test script to verify WhatsApp webhook error handling
// This script simulates webhook payloads with error codes

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Sample webhook payloads with different error scenarios
const webhookPayloads = {
  // Generic error
  genericError: {
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "WHATSAPP-BUSINESS-ACCOUNT-ID",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "PHONE-NUMBER",
                "phone_number_id": "PHONE-NUMBER-ID"
              },
              "statuses": [
                {
                  "id": "wamid.HBgLMTY0NjcwNDM1OTAVAgASGBQzQTdBNjF",
                  "status": "failed",
                  "timestamp": "1703174400",
                  "recipient_id": "1234567890",
                  "errors": [
                    {
                      "code": 131000,
                      "title": "generic_error",
                      "message": "An unspecified error occurred",
                      "error_data": {
                        "messaging_product": "whatsapp",
                        "details": "Internal server error occurred while processing message"
                      }
                    }
                  ]
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  },

  // App not installed error
  appNotInstalled: {
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "WHATSAPP-BUSINESS-ACCOUNT-ID",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "PHONE-NUMBER",
                "phone_number_id": "PHONE-NUMBER-ID"
              },
              "statuses": [
                {
                  "id": "wamid.HBgLMTY0NjcwNDM1OTAVAgASGBQzQTdBNjF",
                  "status": "failed",
                  "timestamp": "1703174400",
                  "recipient_id": "1234567890",
                  "errors": [
                    {
                      "code": 131005,
                      "title": "app_not_installed",
                      "message": "The recipient does not have WhatsApp installed on their device",
                      "error_data": {
                        "messaging_product": "whatsapp",
                        "details": "Recipient phone number not found on WhatsApp"
                      }
                    }
                  ]
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  },

  // Rate limit hit error
  rateLimitHit: {
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "WHATSAPP-BUSINESS-ACCOUNT-ID",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "PHONE-NUMBER",
                "phone_number_id": "PHONE-NUMBER-ID"
              },
              "statuses": [
                {
                  "id": "wamid.HBgLMTY0NjcwNDM1OTAVAgASGBQzQTdBNjF",
                  "status": "failed",
                  "timestamp": "1703174400",
                  "recipient_id": "1234567890",
                  "errors": [
                    {
                      "code": 131042,
                      "title": "rate_limit_hit",
                      "message": "You have exceeded the number of messages you're allowed to send from your phone number",
                      "error_data": {
                        "messaging_product": "whatsapp",
                        "details": "Daily message limit exceeded for phone number"
                      }
                    }
                  ]
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  },

  // User not opted in error
  userNotOptedIn: {
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "WHATSAPP-BUSINESS-ACCOUNT-ID",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "PHONE-NUMBER",
                "phone_number_id": "PHONE-NUMBER-ID"
              },
              "statuses": [
                {
                  "id": "wamid.HBgLMTY0NjcwNDM1OTAVAgASGBQzQTdBNjF",
                  "status": "failed",
                  "timestamp": "1703174400",
                  "recipient_id": "1234567890",
                  "errors": [
                    {
                      "code": 131047,
                      "title": "user_not_opted_in",
                      "message": "You are attempting to send a template message to a user who has not opted-in to receive messages from your business",
                      "error_data": {
                        "messaging_product": "whatsapp",
                        "details": "User has not provided opt-in consent for business messaging"
                      }
                    }
                  ]
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  }
};

async function testWebhookErrorHandling() {
  console.log('Testing WhatsApp webhook error handling...\n');

  for (const [errorType, payload] of Object.entries(webhookPayloads)) {
    try {
      console.log(`Testing ${errorType}...`);
      
      const response = await axios.post(
        `${BACKEND_URL}/webhook/whatsapp`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature': 'sha1=test', // In production, this would be a proper signature
          }
        }
      );

      if (response.status === 200) {
        console.log(`✅ ${errorType}: Webhook processed successfully`);
      } else {
        console.log(`❌ ${errorType}: Unexpected response status: ${response.status}`);
      }
    } catch (error: any) {
      console.log(`❌ ${errorType}: Error - ${error.message}`);
      if (error.response) {
        console.log(`   Response: ${error.response.status} - ${error.response.data}`);
      }
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\nWebhook error handling test completed!');
}

// Run the test
if (require.main === module) {
  testWebhookErrorHandling().catch(console.error);
}

export { testWebhookErrorHandling, webhookPayloads };