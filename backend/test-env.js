require('dotenv').config();

console.log('=== Environment Variables Test ===');
console.log('WHATSAPP_ACCESS_TOKEN exists:', !!process.env.WHATSAPP_ACCESS_TOKEN);
console.log('WHATSAPP_ACCESS_TOKEN length:', process.env.WHATSAPP_ACCESS_TOKEN?.length);
console.log('WHATSAPP_PHONE_NUMBER_ID exists:', !!process.env.WHATSAPP_PHONE_NUMBER_ID);
console.log('WHATSAPP_PHONE_NUMBER_ID value:', process.env.WHATSAPP_PHONE_NUMBER_ID);

// Test WhatsApp config
const whatsappConfig = {
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
};

console.log('\n=== WhatsApp Config ===');
console.log('Config has accessToken:', !!whatsappConfig.accessToken);
console.log('Config has phoneNumberId:', !!whatsappConfig.phoneNumberId);
console.log('Config valid:', !!(whatsappConfig.accessToken && whatsappConfig.phoneNumberId));

