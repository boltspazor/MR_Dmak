// Main API exports - centralized API functions for all backend calls
export { api, API_BASE_URL } from './config';

// Import APIs for convenience client
import { authApi } from './auth';
import { mrApi } from './mr';
import { campaignApi } from './campaigns';
import { templateApi } from './templates';
import { whatsappApi } from './whatsapp';
import { adminApi } from './admin';
import { groupsApi } from './groups';
import { reportsApi } from './reports';

// Authentication API
export { authApi } from './auth';
export type { LoginCredentials, RegisterData, AuthUser, AuthResponse } from './auth';

// MR Management API
export { mrApi } from './mr';
export type { MRData, MRResponse, BulkUploadResult } from './mr';

// Campaign/Message API
export { campaignApi } from './campaigns';
export type { CampaignData, CampaignResponse, CampaignReport } from './campaigns';

// Template API
export { templateApi } from './templates';
export type { TemplateData, TemplateResponse, TemplateStats } from './templates';

// WhatsApp API
export { whatsappApi } from './whatsapp';
export type { AllowedRecipient, WhatsAppMessage, WhatsAppStats } from './whatsapp';

// Admin/Super Admin API
export { adminApi } from './admin';
export type { AdminUser, AdminStats, CreateManagerData, UpdateManagerData, SystemPerformance } from './admin';

// Groups API
export { groupsApi } from './groups';
export type { GroupData, GroupResponse, GroupMember, GroupActivity } from './groups';

// Reports API
export { reportsApi } from './reports';
export type { ReportFilters, DashboardStats, PerformanceMetrics } from './reports';

// Convenience exports for common API calls
export const apiClient = {
  auth: authApi,
  mr: mrApi,
  campaigns: campaignApi,
  templates: templateApi,
  whatsapp: whatsappApi,
  admin: adminApi,
  groups: groupsApi,
  reports: reportsApi
};
