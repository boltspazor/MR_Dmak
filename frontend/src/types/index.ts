export interface User {
  id: string;
  email: string;
  name: string;
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
  groupId: string;
  group?: Group;
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