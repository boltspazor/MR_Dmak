export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.toString().replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
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