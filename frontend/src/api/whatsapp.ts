import { api } from './config';

export interface AllowedRecipient {
  phoneNumber: string;
  formatted: string;
  addedDate?: string;
  addedBy?: string;
}

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'image';
  text?: { body: string };
  image?: { link: string; caption?: string };
}

export interface WhatsAppStats {
  totalRecipients: number;
  activeRecipients: number;
  blockedRecipients: number;
}

// WhatsApp API functions
export const whatsappApi = {
  // Get all allowed recipients
  getAllowedRecipients: async (): Promise<{ success: boolean; recipients: AllowedRecipient[]; count: number }> => {
    const response = await api.get('/whatsapp/allowed-recipients');
    return response.data;
  },

  // Add single recipient to allowed list
  addAllowedRecipient: async (phoneNumber: string): Promise<{ success: boolean; message: string; phoneNumber: string }> => {
    const response = await api.post('/whatsapp/allowed-recipients/add', { phoneNumber });
    return response.data;
  },

  // Add multiple recipients to allowed list
  addAllowedRecipients: async (phoneNumbers: string[]): Promise<{ success: boolean; message: string; added: string[]; count: number }> => {
    const response = await api.post('/whatsapp/allowed-recipients/add-multiple', { phoneNumbers });
    return response.data;
  },

  // Remove single recipient from allowed list
  removeAllowedRecipient: async (phoneNumber: string): Promise<{ success: boolean; message: string; phoneNumber: string }> => {
    const response = await api.post('/whatsapp/allowed-recipients/remove', { phoneNumber });
    return response.data;
  },

  // Remove multiple recipients from allowed list
  removeAllowedRecipients: async (phoneNumbers: string[]): Promise<{ success: boolean; message: string; removed: string[]; count: number }> => {
    const response = await api.post('/whatsapp/allowed-recipients/remove-multiple', { phoneNumbers });
    return response.data;
  },

  // Send single WhatsApp message
  sendMessage: async (message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const response = await api.post('/whatsapp/send', message);
    return response.data;
  },

  // Send bulk WhatsApp messages
  sendBulkMessages: async (messages: WhatsAppMessage[]): Promise<{ success: boolean; results: Array<{ to: string; success: boolean; messageId?: string; error?: string }> }> => {
    const response = await api.post('/whatsapp/send-bulk', { messages });
    return response.data;
  },

  // Get WhatsApp statistics
  getStats: async (): Promise<{ success: boolean; data: WhatsAppStats }> => {
    const response = await api.get('/whatsapp/stats');
    return response.data;
  },

  // Check WhatsApp connection status
  getConnectionStatus: async (): Promise<{ success: boolean; connected: boolean; message?: string }> => {
    const response = await api.get('/whatsapp/status');
    return response.data;
  },

  // Test WhatsApp message
  testMessage: async (phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const response = await api.post('/whatsapp/test', { phoneNumber, message });
    return response.data;
  }
};
