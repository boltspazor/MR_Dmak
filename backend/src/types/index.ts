export interface MRData {
    mrId: string;
    firstName: string;
    lastName: string;
    groupName: string;
    marketingManager: string;
    phone: string;
    email?: string;
    address?: string;
    comments?: string;
  }

export interface MedicalRepresentativeResponse {
    id: string;
    mrId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
    comments?: string;
    groupId: string;
    group: {
        id: string;
        groupName: string;
    };
    marketingManagerId: string;
    marketingManager: {
        id: string;
        name: string;
        email: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
  
  
  export interface WhatsAppMessage {
    to: string;
    type: 'text' | 'image' | 'template';
    text?: { body: string };
    image?: { link: string; caption?: string };
    template?: {
      name: string;
      language: { code: string };
      components?: Array<{
        type: string;
        parameters: Array<{
          type: string;
          text: string;
        }>;
      }>;
    };
  }
  
  
  export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
  }
  
  export interface BulkUploadResult {
    created: number;
    errors: string[];
  }
  