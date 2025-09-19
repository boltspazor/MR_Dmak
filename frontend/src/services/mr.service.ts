// Shared MR data service to ensure consistency across screens
export interface MRData {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  group: string;
  comments?: string;
}

class MRService {
  private storageKey = 'mr_contacts';

  // Get all MRs from API
  async getAllMRs(): Promise<MRData[]> {
    try {
      const response = await api.get('/mrs');
      const mrsData = response.data.data || response.data || [];
      
      // Transform the data to match the expected format
      return mrsData.map((mr: any) => ({
        id: mr._id || mr.id,
        mrId: mr.mrId || mr.id,
        firstName: mr.firstName || '',
        lastName: mr.lastName || '',
        phone: mr.phone || '',
        group: mr.groupName || mr.group || 'Default Group',
        comments: mr.comments || ''
      }));
    } catch (error) {
      console.error('Error loading MRs from API:', error);
      return [];
    }
  }

  // Save MRs
  saveMRs(mrs: MRData[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(mrs));
    } catch (error) {
      console.error('Error saving MRs:', error);
    }
  }

  // Get MRs for a specific campaign/group
  getMRsForCampaign(groups?: string[]): MRData[] {
    const allMRs = this.getAllMRs();
    if (!groups || groups.length === 0) return allMRs;
    
    return allMRs.filter(mr => groups.includes(mr.group));
  }

  // Search MRs
  searchMRs(searchTerm: string): MRData[] {
    const allMRs = this.getAllMRs();
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
  getMRById(mrId: string): MRData | undefined {
    const allMRs = this.getAllMRs();
    return allMRs.find(mr => mr.mrId === mrId);
  }

  // Add new MR
  addMR(mr: MRData): boolean {
    try {
      const allMRs = this.getAllMRs();
      
      // Check for duplicate MR ID
      if (allMRs.some(existing => existing.mrId === mr.mrId)) {
        return false; // Duplicate MR ID
      }

      allMRs.push(mr);
      this.saveMRs(allMRs);
      return true;
    } catch (error) {
      console.error('Error adding MR:', error);
      return false;
    }
  }

  // Update MR
  updateMR(mrId: string, updates: Partial<MRData>): boolean {
    try {
      const allMRs = this.getAllMRs();
      const index = allMRs.findIndex(mr => mr.mrId === mrId);
      
      if (index === -1) return false;

      allMRs[index] = { ...allMRs[index], ...updates };
      this.saveMRs(allMRs);
      return true;
    } catch (error) {
      console.error('Error updating MR:', error);
      return false;
    }
  }

  // Delete MR
  deleteMR(mrId: string): boolean {
    try {
      const allMRs = this.getAllMRs();
      const filtered = allMRs.filter(mr => mr.mrId !== mrId);
      
      if (filtered.length === allMRs.length) return false; // MR not found

      this.saveMRs(filtered);
      return true;
    } catch (error) {
      console.error('Error deleting MR:', error);
      return false;
    }
  }

  // Get available groups
  getGroups(): string[] {
    const allMRs = this.getAllMRs();
    const groups = [...new Set(allMRs.map(mr => mr.group))];
    return groups.sort();
  }

}

// Export singleton instance
export const mrService = new MRService();

