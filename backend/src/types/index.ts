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
  
  export interface MessagePayload {
    content: string;
    imageUrl?: string;
    targetGroups: string[];
    scheduledAt?: Date;
  }
  
  export interface WhatsAppMessage {
    to: string;
    type: 'text' | 'image';
    text?: { body: string };
    image?: { link: string; caption?: string };
  }
  
  export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
    isMarketingManager: boolean;
    marketingManagerId?: string;
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
  
  export interface CampaignReport {
    campaign: any;
    stats: {
      total: number;
      sent: number;
      failed: number;
      pending: number;
    };
  }