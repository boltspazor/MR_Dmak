import { api } from '../lib/api';

// Shared MR data service to ensure consistency across screens
export interface MRData {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  group: string;
  comments?: string;
  metaStatus?: 'ACTIVE' | 'ERROR';
  appStatus?: 'pending' | 'approved' | 'rejected' | 'not_requested';
  lastErrorMessage?: string;
  lastErrorAt?: Date;
  lastErrorCampaignId?: string;
}

class MRService {

  // Get all MRs from API with status information
  async getAllMRs(): Promise<MRData[]> {
    try {
      const response = await api.get('/mrs/with-status');
      const mrsData = response.data.data || response.data || [];
      
      // Transform the data to match the expected format with status information
      return mrsData.map((mr: any) => ({
        id: mr._id || mr.id,
        mrId: mr.mrId || mr.id,
        firstName: mr.firstName || '',
        lastName: mr.lastName || '',
        phone: mr.phone || '',
        group: mr.group?.groupName || mr.groupName || mr.group || 'Default Group',
        comments: mr.comments || '',
        metaStatus: mr.metaStatus || 'ACTIVE',
        appStatus: mr.appStatus || mr.consentStatus || 'not_requested',
        lastErrorMessage: mr.lastErrorMessage,
        lastErrorAt: mr.lastErrorAt ? new Date(mr.lastErrorAt) : undefined,
        lastErrorCampaignId: mr.lastErrorCampaignId
      }));
    } catch (error) {
      console.error('Error loading MRs from API:', error);
      return [];
    }
  }


  // Get MRs for a specific campaign/group
  async getMRsForCampaign(groups?: string[]): Promise<MRData[]> {
    const allMRs = await this.getAllMRs();
    if (!groups || groups.length === 0) return allMRs;
    
    return allMRs.filter(mr => groups.includes(mr.group));
  }

  // Search MRs
  async searchMRs(searchTerm: string): Promise<MRData[]> {
    const allMRs = await this.getAllMRs();
    if (!searchTerm) return allMRs;

    const term = searchTerm.toLowerCase();
    return allMRs.filter(mr => 
      mr.firstName.toLowerCase().includes(term) ||
      mr.lastName.toLowerCase().includes(term) ||
      mr.mrId.toLowerCase().includes(term) ||
      mr.phone.includes(term) ||
      mr.group.toLowerCase().includes(term)
    );
  }

  // Get MR by ID
  async getMRById(mrId: string): Promise<MRData | undefined> {
    const allMRs = await this.getAllMRs();
    return allMRs.find(mr => mr.mrId === mrId);
  }


  // Get available groups
  async getGroups(): Promise<string[]> {
    const allMRs = await this.getAllMRs();
    const groups = [...new Set(allMRs.map(mr => mr.group))];
    return groups.sort();
  }

}

// Export singleton instance
export const mrService = new MRService();


