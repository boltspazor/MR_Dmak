#!/bin/bash

# Meta WhatsApp API Test Script using curl
# Make sure to replace the phone number with your WhatsApp number

API_BASE_URL="http://localhost:5000/api"
TEST_PHONE_NUMBER="+919704991147"  # Replace with your WhatsApp number

echo "🧪 Testing Meta WhatsApp API with curl"
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check connection status
echo -e "\n${YELLOW}1️⃣ Testing WhatsApp Connection Status...${NC}"
curl -X GET "${API_BASE_URL}/whatsapp/test-connection" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"

# Test 2: Send single text message
echo -e "\n${YELLOW}2️⃣ Testing Single Text Message...${NC}"
curl -X POST "${API_BASE_URL}/whatsapp/send" \
  -H "Content-Type: application/json" \
  -d "{
    \"to\": \"${TEST_PHONE_NUMBER}\",
    \"message\": \"Hello! This is a test message from Meta WhatsApp API. 🚀\",
    \"type\": \"text\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"

# Test 3: Send template message
echo -e "\n${YELLOW}3️⃣ Testing Template Message...${NC}"
curl -X POST "${API_BASE_URL}/whatsapp/test-template" \
  -H "Content-Type: application/json" \
  -d "{
    \"phoneNumber\": \"${TEST_PHONE_NUMBER}\",
    \"templateName\": \"hello_world\",
    \"languageCode\": \"en_US\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"

# Test 4: Send bulk messages
echo -e "\n${YELLOW}4️⃣ Testing Bulk Messages...${NC}"
curl -X POST "${API_BASE_URL}/whatsapp/send-bulk" \
  -H "Content-Type: application/json" \
  -d "{
    \"messages\": [
      {
        \"to\": \"${TEST_PHONE_NUMBER}\",
        \"message\": \"Bulk message 1: Testing Meta integration\",
        \"type\": \"text\"
      },
      {
        \"to\": \"${TEST_PHONE_NUMBER}\",
        \"message\": \"Bulk message 2: This is the second message\",
        \"type\": \"text\"
      }
    ]
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"

# Test 5: Add recipient to allowed list
echo -e "\n${YELLOW}5️⃣ Testing Add Recipient...${NC}"
curl -X POST "${API_BASE_URL}/whatsapp/allowed-recipients/add" \
  -H "Content-Type: application/json" \
  -d "{
    \"phoneNumber\": \"${TEST_PHONE_NUMBER}\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"

# Test 6: Get all allowed recipients
echo -e "\n${YELLOW}6️⃣ Testing Get All Recipients...${NC}"
curl -X GET "${API_BASE_URL}/whatsapp/allowed-recipients" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"

# Test 7: Send message to all recipients
echo -e "\n${YELLOW}7️⃣ Testing Send to All Recipients...${NC}"
curl -X POST "${API_BASE_URL}/whatsapp/send-to-all" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"This is a test message sent to all allowed recipients via Meta WhatsApp! 📱\",
    \"type\": \"text\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"

echo -e "\n${GREEN}🎉 All API tests completed!${NC}"
echo -e "${BLUE}📱 Check your WhatsApp to see the test messages.${NC}"
echo -e "\n${YELLOW}💡 Note: Meta WhatsApp requires proper business verification and phone number verification.${NC}"
echo -e "   Make sure your WhatsApp Business API is properly configured in Meta Business Manager."
