export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface UserCreateInput {
    email: string;
    password: string;
    name: string;
    role?: string;
  }
  
  export interface UserUpdateInput {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
  }
  
  export interface UserResponse {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface UserLoginInput {
    email: string;
    password: string;
  }
  
  export interface UserRegisterInput {
    email: string;
    password: string;
    name: string;
  }
  
  export interface UserWithStats extends UserResponse {
    stats: {
      totalGroups: number;
      totalMRs: number;
      totalCampaigns: number;
      totalMessagesSent: number;
      lastLoginAt?: Date;
    };
  }
  
  export interface UserSession {
    userId: string;
    email: string;
    name: string;
    role: string;
    loginAt: Date;
    expiresAt: Date;
    ipAddress: string;
    userAgent: string;
  }
  
  export interface UserPreferences {
    userId: string;
    notifications: {
      email: boolean;
      sms: boolean;
      campaignUpdates: boolean;
      systemAlerts: boolean;
    };
    dashboard: {
      defaultView: 'overview' | 'campaigns' | 'mrs' | 'groups';
      itemsPerPage: number;
      autoRefresh: boolean;
    };
    timezone: string;
    language: string;
  }
  
  export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    USER = 'user'
  }
  
  export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    PENDING = 'pending'
  }
  