import React from 'react';
import { Search, Filter } from 'lucide-react';

export interface CampaignRecord {
  id: string;
  campaignName: string;
  campaignId: string;
  template: {
    name: string;
    metaTemplateName?: string;
    isMetaTemplate: boolean;
    metaStatus?: string;
  };
  recipientList: {
    name: string;
    recipientCount: number;
  };
  date: string;
  sendStatus: 'completed' | 'in progress' | 'pending' | 'failed' | 'cancelled';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  successRate: number;
  status: string;
}

interface CampaignFiltersProps {
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  campaigns: CampaignRecord[];
  filteredCount: number;
}

const CampaignFilters: React.FC<CampaignFiltersProps> = ({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  campaigns,
  filteredCount
}) => {
  const totalCount = campaigns.length;

  const statusOptions = [
    { value: 'all', label: 'All Campaigns' },
    { value: 'pending', label: '⏳ Pending (Ready to Send)' },
    { value: 'sending', label: '📤 Sending (In Progress)' },
    { value: 'completed', label: '✅ Completed (Successfully Sent)' },
    { value: 'failed', label: '❌ Failed (Send Failed)' },
    { value: 'cancelled', label: '🚫 Cancelled' },
    { value: 'draft', label: '📝 Draft (Not Ready)' }
  ];

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h3>
        <p className="text-sm text-gray-600">
          Showing {filteredCount} of {totalCount} campaigns
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Campaigns</label>
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns by name, template, or recipient list..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default CampaignFilters;
