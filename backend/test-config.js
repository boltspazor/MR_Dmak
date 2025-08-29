require('dotenv').config();

// Test the actual config module
const { whatsappConfig } = require('./dist/config/whatsapp.js');

console.log('=== WhatsApp Config Module Test ===');
console.log('Config accessToken exists:', !!whatsappConfig.accessToken);
console.log('Config phoneNumberId exists:', !!whatsappConfig.phoneNumberId);
console.log('Config accessToken length:', whatsappConfig.accessToken?.length);
console.log('Config phoneNumberId:', whatsappConfig.phoneNumberId);

console.log('\n=== Direct Environment Check ===');
console.log('ENV accessToken exists:', !!process.env.WHATSAPP_ACCESS_TOKEN);
console.log('ENV phoneNumberId exists:', !!process.env.WHATSAPP_PHONE_NUMBER_ID);
console.log('ENV accessToken length:', process.env.WHATSAPP_ACCESS_TOKEN?.length);
console.log('ENV phoneNumberId:', process.env.WHATSAPP_PHONE_NUMBER_ID);

