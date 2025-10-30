export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isMarketingManager: boolean;
  marketingManagerId?: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  // Role management
  userRole: 'super_admin' | 'admin' | 'user';
  hasPermission: (page: string) => boolean;
  canAccess: (page: string) => boolean;
  isSuperAdmin: () => boolean;
  isMarketingManager: () => boolean; // Based on user.isMarketingManager flag
  isAdmin: () => boolean;
  isUser: () => boolean;
}

export interface MedicalRepresentative {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  groupId: string;
  group?: Group;
  marketingManagerId: string;
  marketingManager?: {
    id: string;
    name: string;
    email: string;
  };
  comments?: string;
  consentStatus: 'pending' | 'approved' | 'rejected' | 'not_requested';
  isActive?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  groupName: string;
  description?: string;
  userId: string;
  mrCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  campaignId: string;
  userId: string;
  content: string;
  imageUrl?: string;
  targetGroups: string[];
  status: 'pending' | 'sending' | 'completed' | 'failed';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalMRs: number;
  totalGroups: number;
  totalCampaigns: number;
  recentCampaigns: Campaign[];
  groupStats: Array<{
    groupName: string;
    mrCount: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Template {
  _id: string;
  name: string;
  content: string;
  type: 'html' | 'text' | 'image';
  imageUrl?: string;
  imageFileName?: string;
  footerImageUrl?: string;
  footerImageFileName?: string;
  parameters: Array<{name: string, type: 'text' | 'number'}> | string[]; // Support both new format and legacy
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  recipientLists?: TemplateRecipients[];
  createdAt: string;
  updatedAt: string;
  // Meta template properties
  isMetaTemplate?: boolean;
  metaStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED' | 'PAUSED' | 'PENDING_DELETION';
  metaCategory?: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  metaTemplateId?: string;
  metaTemplateName?: string;
}

export interface TemplateRecipients {
  _id: string;
  templateId: string;
  name: string;
  description?: string;
  recipients: Array<{
    _id: string;
    mrId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    groupId: string;
    parameters: Record<string, string>;
  }>;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateStats {
  totalTemplates: number;
  htmlTemplates: number;
  textTemplates: number;
  imageTemplates: number;
  avgParameters: number;
}

export interface RecipientList {
  _id: string;
  name: string;
  description?: string;
  columns: string[];
  data: Array<Record<string, any>>;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CSVExportOptions {
  /** Custom filename for the downloaded CSV (without .csv extension) */
  filename?: string;
  /** Whether to include headers in the CSV */
  includeHeaders?: boolean;
  /** Custom headers to use instead of object keys */
  headers?: string[];
  /** Column delimiter (default: comma) */
  delimiter?: string;
}

export interface UseCSVExportProps<T extends Record<string, any>> {
  /** The data array to export */
  data: T[];
  /** Export configuration options */
  options?: CSVExportOptions;
}

export interface CSVColumnMapping {
  [key: string]: string;
}