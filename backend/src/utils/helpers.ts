export const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.toString().replace(/\D/g, '');
    
    // Handle different phone number formats
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    if (cleaned.length === 13 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    
    // If it already has +91, return as is
    if (phone.startsWith('+91')) {
      return phone;
    }
    
    return `+${cleaned}`;
  };
  
  export const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };
  
  export const generateMRId = (): string => {
    return `MR${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  
  export const sanitizeString = (str: string): string => {
    return str.trim().replace(/[<>]/g, '');
  };