import api from './api';
import { MedicalRepresentative, CreateMRForm, UpdateMRForm, SearchFilters, PaginatedResponse, BulkUploadResponse } from '../types';

export class MRsService {
  async getMRs(filters?: SearchFilters): Promise<PaginatedResponse<MedicalRepresentative>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get(`/mrs?${params.toString()}`);
    return response.data;
  }

  async getMRById(id: string): Promise<MedicalRepresentative> {
    const response = await api.get(`/mrs/${id}`);
    return response.data.mr;
  }

  async createMR(mrData: CreateMRForm): Promise<MedicalRepresentative> {
    const response = await api.post('/mrs', mrData);
    return response.data.mr;
  }

  async updateMR(id: string, mrData: UpdateMRForm): Promise<{ message: string }> {
    const response = await api.put(`/mrs/${id}`, mrData);
    return response.data;
  }

  async deleteMR(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/mrs/${id}`);
    return response.data;
  }

  async bulkUpload(file: File): Promise<BulkUploadResponse> {
    const formData = new FormData();
    formData.append('excel', file);
    
    const response = await api.post('/mrs/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async downloadTemplate(): Promise<void> {
    const response = await api.get('/mrs/template', {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mr-template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export default new MRsService();
