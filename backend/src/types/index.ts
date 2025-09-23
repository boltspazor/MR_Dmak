// Re-export all types from organized type files
export * from './common';
export * from './communication';

// Re-export JwtPayload from jsonwebtoken
export { JwtPayload } from 'jsonwebtoken';

// Legacy types for backward compatibility
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

export interface BulkUploadResult {
  created: number;
  errors: string[];
}
  