export interface CampaignFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CampaignSearchFilters {
  searchTerm: string;
  statusFilter: string;
}

export interface CampaignPaginationParams extends CampaignFilterParams {}

// Status options for campaign filtering
export const CAMPAIGN_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
] as const;

export type CampaignStatus = 'completed' | 'pending' | 'failed';