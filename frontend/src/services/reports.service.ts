import api from './api';
import { DashboardStats, DetailedCampaignReport } from '../types';

export class ReportsService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/reports/dashboard');
    return response.data;
  }

  async getDetailedReport(campaignId: string): Promise<DetailedCampaignReport> {
    const response = await api.get(`/reports/campaign/${campaignId}`);
    return response.data;
  }

  async exportReport(campaignId: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    const response = await api.get(`/reports/campaign/${campaignId}/export?format=${format}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    
    if (format === 'csv') {
      // Create download link for CSV
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `campaign-${campaignId}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { message: 'Export completed' };
    }
    
    return response.data;
  }
}

export default new ReportsService();
