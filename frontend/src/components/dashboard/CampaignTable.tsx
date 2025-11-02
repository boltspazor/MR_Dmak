import React from 'react';
import { MessageSquare, BarChart3, Clock, CheckCircle, X } from 'lucide-react';
import { SkeletonTable } from '../ui/SkeletonLoader';
import { PaginationControls } from "../../components/PaginationControls";
import { useCSVExportWithMapping } from '../../hooks/useCSVExport';


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
  sendStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  successRate: number;
  status: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    isMarketingManager?: boolean;
  };
}

interface CampaignTableProps {
  campaigns: CampaignRecord[];
  onRecipientListClick: (campaign: CampaignRecord) => void;
  onTemplatePreview: (campaign: CampaignRecord) => void;
  sortField: keyof CampaignRecord;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof CampaignRecord) => void;
  loading?: boolean;
  templateLoading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  statusFilter?: string; // Add status filter prop
  searchTerm?: string; // Add search term prop
  filteredTotal?: number; // number of campaigns matching current filters (server-provided total)
  showCampaignOwner?: boolean; // Show campaign owner column (for super admins)
}

const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  onRecipientListClick,
  onTemplatePreview,
  sortField,
  sortDirection,
  onSort,
  loading = false,
  templateLoading = false,
  page,
  totalPages,
  onPageChange,
  statusFilter,
  searchTerm,
  filteredTotal,
  showCampaignOwner = false
}) => {
  // CSV Export functionality
  const { exportToCSV, canExport } = useCSVExportWithMapping({
    data: campaigns,
    columnMapping: {
      'campaignName': 'Campaign Name',
      'campaignId': 'Campaign ID',
      'template.name': 'Template Name',
      'recipientList.name': 'Recipient List',
      'date': 'Date',
      'status': 'Status',
      'totalRecipients': 'Total Recipients',
      'sentCount': 'Sent Count',
      'failedCount': 'Failed Count',
      'successRate': 'Success Rate'
    },
    options: {
      filename: 'campaigns-export'
    }
  });

  const getEffectiveStatus = (campaign: CampaignRecord): string => {
    return campaign.status || "pending";
  };


  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
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
    // Create status-specific messages
    const getStatusMessage = () => {
      if (statusFilter) {
        const statusMessages: { [key: string]: { title: string; description: string } } = {
          'pending': {
            title: 'No Pending Campaigns',
            description: 'There are no campaigns with pending status at the moment.'
          },
          'completed': {
            title: 'No Completed Campaigns',
            description: 'There are no campaigns that have been completed yet.'
          },
          'in-progress': {
            title: 'No In-Progress Campaigns',
            description: 'There are no campaigns currently in progress.'
          },
          'failed': {
            title: 'No Failed Campaigns',
            description: 'There are no campaigns with failed status.'
          }
        };
        
        const statusKey = statusFilter.toLowerCase();
        if (statusMessages[statusKey]) {
          return statusMessages[statusKey];
        }
      }
      
      if (searchTerm) {
        return {
          title: 'No campaigns match your search',
          description: `No campaigns found matching "${searchTerm}". Try a different search term.`
        };
      }
      
      return {
        title: 'No campaigns found',
        description: 'Create your first campaign to get started.'
      };
    };
    
  const message = getStatusMessage();
    
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {message.title}
          </h3>
          <p className="text-gray-500 text-sm">
            {message.description}
          </p>
          {typeof filteredTotal === 'number' && (
            <p className="text-gray-400 text-xs mt-2">Showing 0 out of {filteredTotal} total campaigns</p>
          )}
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
              {showCampaignOwner && (
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                  Campaign Owner
                </th>
              )}
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
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-6 text-sm text-gray-900">
                  <div className="font-medium">{campaign.campaignName}</div>
                </td>
                {showCampaignOwner && (
                  <td className="py-3 px-6 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{campaign.createdBy?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">
                        ({
                          campaign.createdBy?.role === 'super_admin' 
                            ? 'Super Admin' 
                            : campaign.createdBy?.isMarketingManager 
                              ? 'Marketing Manager' 
                              : 'Admin'
                        })
                      </div>
                    </div>
                  </td>
                )}
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
                      <button
                        onClick={() => onRecipientListClick(campaign)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline text-left"
                      >
                        {campaign.recipientList.name}
                      </button>
                      <div className="text-xs text-gray-500">
                        {campaign.recipientList.recipientCount} recipients
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onRecipientListClick(campaign)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline text-left"
                      >
                        Direct MR Selection
                      </button>
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

              </tr>
            ))}
          </tbody>
        </table>
        {page !== undefined && totalPages !== undefined && onPageChange && (
          <div className="mt-4">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}

        {/* Export Button */}
        {campaigns.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={exportToCSV}
                disabled={!canExport}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Export
              </button>
              <div className="text-sm text-gray-500">
                Showing {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CampaignTable;