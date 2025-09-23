import React, { useState, useMemo } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import CampaignTable from './CampaignTable';
import CampaignFilters from './CampaignFilters';
import { CampaignRecord } from './CampaignTable';

interface CampaignTabsProps {
  campaigns: CampaignRecord[];
  onRecipientListClick: (campaign: CampaignRecord) => void;
  onTemplatePreview: (campaign: CampaignRecord) => void;
  onResendCampaign?: (campaign: CampaignRecord) => void;
  sortField: keyof CampaignRecord;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof CampaignRecord) => void;
  loading?: boolean;
}

const CampaignTabs: React.FC<CampaignTabsProps> = ({
  campaigns,
  onRecipientListClick,
  onTemplatePreview,
  onResendCampaign,
  sortField,
  sortDirection,
  onSort,
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed'>('ongoing');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Separate campaigns into ongoing and completed
  const { ongoingCampaigns, completedCampaigns } = useMemo(() => {
    const ongoing = campaigns.filter(campaign => {
      // If status is explicitly completed, cancelled, or failed, it's completed
      if (campaign.status === 'completed' || 
          campaign.status === 'cancelled' || 
          campaign.status === 'failed') {
        return false;
      }
      
      // If status is sending but all messages are processed, consider it completed
      if (campaign.status === 'sending') {
        const processed = campaign.sentCount + campaign.failedCount;
        if (processed >= campaign.totalRecipients) {
          return false; // This should be in completed
        }
      }
      
      // Otherwise, it's ongoing
      return true;
    });
    
    const completed = campaigns.filter(campaign => {
      // Explicitly completed statuses
      if (campaign.status === 'completed' || 
          campaign.status === 'cancelled' || 
          campaign.status === 'failed') {
        return true;
      }
      
      // Sending campaigns where all messages are processed
      if (campaign.status === 'sending') {
        const processed = campaign.sentCount + campaign.failedCount;
        if (processed >= campaign.totalRecipients) {
          return true;
        }
      }
      
      return false;
    });

    return { ongoingCampaigns: ongoing, completedCampaigns: completed };
  }, [campaigns]);

  // Filter campaigns based on search and status
  const filterCampaigns = (campaignList: CampaignRecord[]) => {
    return campaignList.filter(campaign => {
      const matchesSearch = 
        campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.campaignId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (campaign.recipientList?.name || 'Direct MR Selection').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredOngoingCampaigns = filterCampaigns(ongoingCampaigns);
  const filteredCompletedCampaigns = filterCampaigns(completedCampaigns);

  const currentCampaigns = activeTab === 'ongoing' ? filteredOngoingCampaigns : filteredCompletedCampaigns;
  const currentCount = currentCampaigns.length;

  const tabs = [
    {
      id: 'ongoing' as const,
      label: 'Ongoing Campaigns',
      count: ongoingCampaigns.length,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'completed' as const,
      label: 'Completed Campaigns',
      count: completedCampaigns.length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                activeTab === tab.id 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <CampaignFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        campaigns={currentCampaigns}
        filteredCount={currentCount}
      />

      {/* Campaign Table */}
      <CampaignTable
        campaigns={currentCampaigns}
        onRecipientListClick={onRecipientListClick}
        onTemplatePreview={onTemplatePreview}
        onResendCampaign={onResendCampaign}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        loading={loading}
      />
    </div>
  );
};

export default CampaignTabs;
