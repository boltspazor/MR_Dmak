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
  parameters: string[];
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