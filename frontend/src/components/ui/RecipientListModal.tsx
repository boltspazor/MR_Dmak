import React, { useState, useMemo } from 'react';
import { X, MessageSquare, BarChart3, Search, TrendingUp, RefreshCw } from 'lucide-react';
import { useCampaignProgress } from '../../hooks/useCampaignProgress';
import { SkeletonTable, SkeletonLoader } from './SkeletonLoader';

export interface GroupMember {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  group: string;
  status: 'sent' | 'failed' | 'pending' | 'queued';
  sentAt?: string;
  errorMessage?: string;
  messageId?: string;
}

interface RecipientListModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: GroupMember[];
  campaignName?: string;
  campaignId?: string; // Add campaign ID for progress tracking
  onExportCSV?: () => void;
  showExportButton?: boolean;
  showProgress?: boolean; // Add option to show/hide progress
}

const RecipientListModal: React.FC<RecipientListModalProps> = ({
  isOpen,
  onClose,
  recipients,
  campaignName = 'Campaign',
  campaignId,
  onExportCSV,
  showExportButton = true,
  showProgress = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');

  // Campaign progress tracking
  const { progress, loading: progressLoading, refreshing, refreshProgress } = useCampaignProgress({
    campaignId: campaignId || undefined,
    autoRefresh: showProgress && !!campaignId,
    refreshInterval: 10000 // Refresh every 10 seconds
  });

  // Get recipients from progress data or fallback to props
  const actualRecipients = useMemo(() => {
    if (progress?.recipients && progress.recipients.length > 0) {
      // Use real data from campaign progress
      return progress.recipients.map(recipient => ({
        id: recipient.id,
        mrId: recipient.mrId,
        firstName: recipient.firstName,
        lastName: recipient.lastName,
        name: `${recipient.firstName} ${recipient.lastName}`,
        phone: recipient.phone,
        email: recipient.email || '',
        group: recipient.group,
        status: recipient.status,
        sentAt: recipient.sentAt,
        errorMessage: recipient.errorMessage,
        messageId: recipient.messageId
      }));
    }
    // Fallback to props recipients - ensure they have name field
    return recipients.map(recipient => ({
      ...recipient,
      name: recipient.name || `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim()
    }));
  }, [progress?.recipients, recipients]);

  // Get unique groups for filter dropdown
  const uniqueGroups = useMemo(() => {
    const groups = [...new Set(actualRecipients.map(recipient => recipient.group))];
    return groups.sort();
  }, [actualRecipients]);

  // Filter recipients based on search and filters
  const filteredRecipients = useMemo(() => {
    return actualRecipients.filter(recipient => {
      const matchesSearch = 
        recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipient.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recipient.email && recipient.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || recipient.status === statusFilter;
      const matchesGroup = groupFilter === 'all' || recipient.group === groupFilter;
      
      return matchesSearch && matchesStatus && matchesGroup;
    });
  }, [actualRecipients, searchTerm, statusFilter, groupFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = actualRecipients.length;
    const sent = actualRecipients.filter(r => r.status === 'sent').length;
    const failed = actualRecipients.filter(r => r.status === 'failed').length;
    const pending = actualRecipients.filter(r => r.status === 'pending' || r.status === 'queued').length;
    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;
    
    return { total, sent, failed, pending, successRate };
  }, [actualRecipients]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Recipient List Details
            </h2>
            {campaignName && (
              <p className="text-sm text-gray-600 mt-1">
                Campaign: {campaignName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Summary Section */}
        <div className="bg-indigo-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-indigo-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <div className="h-4 w-4 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters Section */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <p className="text-xs text-gray-500">
              {filteredRecipients.length} of {actualRecipients.length} recipients
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search recipients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-lg border-0 bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-0 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
                <option value="queued">Queued</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-0 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Groups</option>
                {uniqueGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b bg-indigo-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recipients</h3>
              <span className="text-sm text-gray-700 font-bold">
                {filteredRecipients.length} Recipients
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            {actualRecipients.length === 0 && !progressLoading ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Loading recipients...</p>
              </div>
            ) : filteredRecipients.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  {actualRecipients.length === 0 
                    ? 'No recipients found for this campaign' 
                    : 'No recipients match the current filters'
                  }
                </p>
                {actualRecipients.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    This campaign may not have any recipients assigned yet.
                  </p>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-indigo-50 border-b">
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Name</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Phone</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Group</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Sent At</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700 bg-indigo-50">Message ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipients.map(recipient => (
                    <tr key={recipient.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-6 text-sm text-gray-900 text-left">
                        <div>
                          <div className="font-medium">{recipient.name}</div>
                          <div className="text-xs text-gray-500">ID: {recipient.mrId}</div>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-900 text-left">{recipient.phone}</td>
                      <td className="py-3 px-6 text-sm text-gray-900 text-left">{recipient.group}</td>
                      <td className="py-3 px-6 text-sm text-left">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          recipient.status === 'sent' 
                            ? 'bg-green-100 text-green-800' 
                            : recipient.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : recipient.status === 'queued'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {recipient.status}
                        </span>
                        {recipient.errorMessage && (
                          <div className="text-xs text-red-600 mt-1" title={recipient.errorMessage}>
                            {recipient.errorMessage.length > 30 
                              ? `${recipient.errorMessage.substring(0, 30)}...` 
                              : recipient.errorMessage
                            }
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-900 text-left">
                        {recipient.sentAt ? new Date(recipient.sentAt).toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-900 text-left">
                        {recipient.messageId ? (
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {recipient.messageId.substring(0, 20)}...
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        {/* Export Button */}
        {showExportButton && onExportCSV && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onExportCSV}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipientListModal;
