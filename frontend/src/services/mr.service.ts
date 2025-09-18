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

  // Get all MRs
  getAllMRs(): MRData[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.getDefaultMRs();
    } catch (error) {
      console.error('Error loading MRs:', error);
      return this.getDefaultMRs();
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

  // Get default MRs for development
  private getDefaultMRs(): MRData[] {
    return [
      {
        id: '1',
        mrId: 'MR001',
        firstName: 'Dr. Rajesh',
        lastName: 'Sharma',
        phone: '+919876543210',
        group: 'North Zone',
        comments: 'Cardiologist - Active'
      },
      {
        id: '2',
        mrId: 'MR002',
        firstName: 'Dr. Priya',
        lastName: 'Patel',
        phone: '+919876543211',
        group: 'West Zone',
        comments: 'Neurologist - Premium'
      },
      {
        id: '3',
        mrId: 'MR003',
        firstName: 'Dr. Amit',
        lastName: 'Singh',
        phone: '+919876543212',
        group: 'East Zone',
        comments: 'Pediatrician - Regular'
      },
      {
        id: '4',
        mrId: 'MR004',
        firstName: 'Dr. Sunita',
        lastName: 'Reddy',
        phone: '+919876543213',
        group: 'South Zone',
        comments: 'Gynecologist - VIP'
      },
      {
        id: '5',
        mrId: 'MR005',
        firstName: 'Dr. Vikram',
        lastName: 'Joshi',
        phone: '+919876543214',
        group: 'Central Zone',
        comments: 'Orthopedic - Active'
      },
      {
        id: '6',
        mrId: 'MR006',
        firstName: 'Dr. Anita',
        lastName: 'Kumar',
        phone: '+919876543215',
        group: 'North Zone',
        comments: 'Dermatologist - Premium'
      },
      {
        id: '7',
        mrId: 'MR007',
        firstName: 'Dr. Rahul',
        lastName: 'Gupta',
        phone: '+919876543216',
        group: 'West Zone',
        comments: 'ENT Specialist - Regular'
      },
      {
        id: '8',
        mrId: 'MR008',
        firstName: 'Dr. Meera',
        lastName: 'Nair',
        phone: '+919876543217',
        group: 'East Zone',
        comments: 'Psychiatrist - Active'
      },
      {
        id: '9',
        mrId: 'MR009',
        firstName: 'Dr. Kiran',
        lastName: 'Rao',
        phone: '+919876543218',
        group: 'South Zone',
        comments: 'Oncologist - VIP'
      },
      {
        id: '10',
        mrId: 'MR010',
        firstName: 'Dr. Suresh',
        lastName: 'Verma',
        phone: '+919876543219',
        group: 'Central Zone',
        comments: 'General Physician - Regular'
      }
    ];
  }
}

// Export singleton instance
export const mrService = new MRService();

