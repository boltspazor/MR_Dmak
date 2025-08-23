import api from './api';
import { Group, GroupStats, GroupActivity, CreateGroupForm, SearchFilters, PaginatedResponse, BulkDeleteRequest, BulkMoveRequest } from '../types';

export class GroupsService {
  async getGroups(filters?: SearchFilters): Promise<PaginatedResponse<Group>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get(`/groups?${params.toString()}`);
    return response.data;
  }

  async getGroupById(id: string): Promise<Group> {
    const response = await api.get(`/groups/${id}`);
    return response.data.group;
  }

  async createGroup(groupData: CreateGroupForm): Promise<Group> {
    const response = await api.post('/groups', groupData);
    return response.data.group;
  }

  async updateGroup(id: string, groupData: CreateGroupForm): Promise<{ updatedCount: number }> {
    const response = await api.put(`/groups/${id}`, groupData);
    return response.data;
  }

  async deleteGroup(id: string): Promise<{ deletedCount: number }> {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  }

  async getGroupStats(id: string): Promise<GroupStats> {
    const response = await api.get(`/groups/${id}/stats`);
    return response.data.stats;
  }

  async getGroupMRs(id: string, filters?: SearchFilters): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get(`/groups/${id}/mrs?${params.toString()}`);
    return response.data;
  }

  async moveMRsToGroup(targetGroupId: string, moveData: BulkMoveRequest): Promise<{ movedCount: number; errors: string[] }> {
    const response = await api.post(`/groups/${targetGroupId}/mrs/move`, moveData);
    return response.data;
  }

  async exportGroupData(id: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    const response = await api.get(`/groups/${id}/export?format=${format}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    
    if (format === 'csv') {
      // Create download link for CSV
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `group-${id}-data.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { message: 'Export completed' };
    }
    
    return response.data;
  }

  async getGroupActivity(id: string, filters?: SearchFilters): Promise<PaginatedResponse<GroupActivity>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get(`/groups/${id}/activity?${params.toString()}`);
    return response.data;
  }

  async bulkDeleteGroups(deleteData: BulkDeleteRequest): Promise<{ deletedCount: number; errors: string[] }> {
    const response = await api.delete('/groups/bulk', { data: deleteData });
    return response.data;
  }
}

export default new GroupsService();
