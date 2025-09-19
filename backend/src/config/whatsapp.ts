export const whatsappConfig = {
    // Twilio Configuration
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886', // Twilio Sandbox number
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "token1234",
  };