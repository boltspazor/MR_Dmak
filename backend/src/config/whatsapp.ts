export const whatsappConfig = {
    // Waguru WhatsApp API Configuration
    apiUrl: process.env.WAGURU_API_URL || 'https://waguru.me/api',
    accessToken: process.env.WAGURU_ACCESS_TOKEN || 'pcGiOSFNbQsjCVglhM0d6lGqqJ5F3idx3s3RPWLPgZ2pDgtv96JbBvMKTo50eqgf',
    vendorUid: process.env.WAGURU_VENDOR_UID || 'e555ce6e-1c3c-4dca-b06b-4f2cbedde6c1',
    fromPhoneNumberId: process.env.WAGURU_FROM_PHONE_NUMBER_ID || '', // Optional: default phone number ID
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "token1234",
  };