import React from 'react';
import { MessageSquare, BarChart3, Clock, CheckCircle, X } from 'lucide-react';
import { SkeletonTable } from '../ui/SkeletonLoader';

export interface CampaignRecord {
  id: string;
  campaignName: string;
  campaignId: string;
  template: {
    id: string;
    name: string;
    metaTemplateName?: string;
    isMetaTemplate: boolean;
    metaStatus?: string;
  };
  recipientList: {
    name: string;
    recipientCount: number;
  } | null;
  date: string;
  sendStatus: 'completed' | 'in progress' | 'pending' | 'failed' | 'cancelled';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  successRate: number;
  status: string;
}

interface CampaignTableProps {
  campaigns: CampaignRecord[];
  onRecipientListClick: (campaign: CampaignRecord) => void;
  onTemplatePreview: (campaign: CampaignRecord) => void;
  onViewTemplate?: (campaign: CampaignRecord) => void;
  onResendCampaign?: (campaign: CampaignRecord) => void;
  sortField: keyof CampaignRecord;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof CampaignRecord) => void;
  loading?: boolean;
  templateLoading?: boolean;
}

const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  onRecipientListClick,
  onTemplatePreview,
  onViewTemplate,
  onResendCampaign,
  sortField,
  sortDirection,
  onSort,
  loading = false,
  templateLoading = false
}) => {
  const getEffectiveStatus = (campaign: CampaignRecord): string => {
    // Calculate how many recipients have been processed
    const processed = campaign.sentCount + campaign.failedCount;
    const isFullyProcessed = processed >= campaign.totalRecipients;
    
    // If all recipients have been processed, show as completed
    if (isFullyProcessed) {
      return 'completed';
    }
    
    // If not all recipients have been processed, show as active
    return 'active';
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'sending':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-600" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSort = (field: keyof CampaignRecord) => {
    onSort(field);
  };

  const SortButton: React.FC<{ field: keyof CampaignRecord; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-indigo-600 focus:outline-none"
    >
      <span>{children}</span>
      {sortField === field && (
        <span className="text-indigo-600">
          {sortDirection === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  );

  if (loading) {
    return <SkeletonTable rows={5} columns={7} />;
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-500 text-sm">
            Create your first campaign to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-indigo-50">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                <SortButton field="campaignName">Campaign Name</SortButton>
              </th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                Template
              </th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                Recipient List
              </th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                <SortButton field="date">Date</SortButton>
              </th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                Progress
              </th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-6 text-sm text-gray-900">
                  <div className="font-medium">{campaign.campaignName}</div>
                </td>
                <td className="py-3 px-6 text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onTemplatePreview(campaign)}
                      disabled={templateLoading}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {templateLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </span>
                      ) : (
                        campaign.template.name
                      )}
                    </button>
                    {campaign.template.isMetaTemplate && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Meta
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-6 text-sm text-gray-900">
                  {campaign.recipientList ? (
                    <>
                      <div className="font-medium">{campaign.recipientList.name}</div>
                      <div className="text-xs text-gray-500">
                        {campaign.recipientList.recipientCount} recipients
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-gray-600">Direct MR Selection</div>
                      <div className="text-xs text-gray-500">
                        {campaign.totalRecipients} recipients
                      </div>
                    </>
                  )}
                </td>
                <td className="py-3 px-6 text-sm text-gray-900">
                  {new Date(campaign.date).toLocaleDateString()}
                </td>
                <td className="py-3 px-6 text-sm">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(getEffectiveStatus(campaign))}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getEffectiveStatus(campaign))}`}>
                      {getEffectiveStatus(campaign)}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-6 text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                    <div className="text-sm">
                      <div className="flex space-x-2">
                        <span className="text-green-600">{campaign.sentCount}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{campaign.totalRecipients}</span>
                        {campaign.failedCount > 0 && (
                          <>
                            <span className="text-gray-400"> (</span>
                            <span className="text-red-600">{campaign.failedCount} failed</span>
                            <span className="text-gray-400">)</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {campaign.sentCount + campaign.failedCount} of {campaign.totalRecipients} processed
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${campaign.successRate}%` }}
                    ></div>
                  </div>
                </td>
                <td className="py-3 px-6 text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onRecipientListClick(campaign)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium hover:underline"
                    >
                      View Recipients
                    </button>
                    {onViewTemplate && campaign.template && (
                      <button
                        onClick={() => onViewTemplate(campaign)}
                        className="text-purple-600 hover:text-purple-800 text-xs font-medium hover:underline"
                      >
                        View Template
                      </button>
                    )}
                    {getEffectiveStatus(campaign) === 'pending' && onResendCampaign && (
                      <button
                        onClick={() => onResendCampaign(campaign)}
                        className="text-green-600 hover:text-green-800 text-xs font-medium hover:underline"
                      >
                        Resend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CampaignTable;