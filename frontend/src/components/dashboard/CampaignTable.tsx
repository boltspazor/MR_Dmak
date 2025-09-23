import React from 'react';
import { MessageSquare, BarChart3, Clock, CheckCircle, X } from 'lucide-react';
import { SkeletonTable } from '../ui/SkeletonLoader';

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
  onResendCampaign?: (campaign: CampaignRecord) => void;
  sortField: keyof CampaignRecord;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof CampaignRecord) => void;
  loading?: boolean;
}

const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  onRecipientListClick,
  onTemplatePreview,
  onResendCampaign,
  sortField,
  sortDirection,
  onSort,
  loading = false
}) => {
  const getEffectiveStatus = (campaign: CampaignRecord): string => {
    // If status is explicitly completed, cancelled, or failed, use that
    if (campaign.status === 'completed' || 
        campaign.status === 'cancelled' || 
        campaign.status === 'failed') {
      return campaign.status;
    }
    
    // If status is sending but all messages are processed, show as completed
    if (campaign.status === 'sending') {
      const processed = campaign.sentCount + campaign.failedCount;
      if (processed >= campaign.totalRecipients) {
        return 'completed';
      }
      return 'sending';
    }
    
    // For other statuses, return as-is
    return campaign.status;
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
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
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
                    >
                      {campaign.template.name}
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
                        <span className="text-green-600">{Math.min(campaign.sentCount, campaign.totalRecipients)}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{campaign.totalRecipients}</span>
                      </div>
                    </div>
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