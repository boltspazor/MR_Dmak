import { api } from './config';

export interface GroupData {
  groupName: string;
  description?: string;
}

export interface GroupResponse {
  id: string;
  groupName: string;
  description?: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface GroupMember {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  group: string;
}

export interface GroupActivity {
  id: string;
  action: string;
  description: string;
  performedBy: {
    id: string;
    name: string;
  };
  timestamp: Date;
  metadata?: any;
}

// Groups API functions
export const groupsApi = {
  // Get all groups for current user
  getAll: async (): Promise<{ success: boolean; data: GroupResponse[] }> => {
    const response = await api.get('/groups');
    return response.data;
  },

  // Get group by ID
  getById: async (id: string): Promise<{ success: boolean; data: GroupResponse }> => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  // Create new group
  create: async (groupData: GroupData): Promise<{ success: boolean; data: GroupResponse; message: string }> => {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  // Update group
  update: async (id: string, groupData: Partial<GroupData>): Promise<{ success: boolean; data: GroupResponse; message: string }> => {
    const response = await api.put(`/groups/${id}`, groupData);
    return response.data;
  },

  // Delete group
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  },

  // Get group members
  getMembers: async (id: string): Promise<{ success: boolean; data: GroupMember[] }> => {
    const response = await api.get(`/groups/${id}/members`);
    return response.data;
  },

  // Add member to group
  addMember: async (groupId: string, mrId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/groups/${groupId}/members`, { mrId });
    return response.data;
  },

  // Remove member from group
  removeMember: async (groupId: string, mrId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/groups/${groupId}/members/${mrId}`);
    return response.data;
  },

  // Get group activity
  getActivity: async (id: string, limit: number = 50): Promise<{ success: boolean; data: GroupActivity[] }> => {
    const response = await api.get(`/groups/${id}/activity?limit=${limit}`);
    return response.data;
  },

  // Get group statistics
  getStats: async (): Promise<{ success: boolean; data: { totalGroups: number; totalMembers: number; averageMembersPerGroup: number } }> => {
    const response = await api.get('/groups/stats');
    return response.data;
  },

  // Search groups
  search: async (query: string): Promise<{ success: boolean; data: GroupResponse[] }> => {
    const response = await api.get(`/groups/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Export group members
  exportMembers: async (id: string): Promise<Blob> => {
    const response = await api.get(`/groups/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  }
};
