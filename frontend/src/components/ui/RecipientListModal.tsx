
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, Search, Filter, ChevronDown } from 'lucide-react';
import { formatErrorMessage, getErrorTooltip } from '../../utils/whatsappErrorCodes';
import { campaignsAPI } from '../../api/campaigns-new';
import { useSearchParams } from 'react-router-dom';

export interface GroupMember {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  name?: string;
  phone: string;
  email?: string;
  group: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
  errorCode?: number;
  errorTitle?: string;
  errorDetails?: string;
  messageId?: string;
}

interface RecipientListModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients?: GroupMember[];
  campaignName?: string;
  campaignId?: string;
  showProgress?: boolean;
  onExportCSV?: () => void;
  showExportButton?: boolean;
}

const RecipientListModal: React.FC<RecipientListModalProps> = ({
  isOpen,
  onClose,
  recipients = [],
  campaignName = 'Campaign',
  campaignId,
  showProgress = false,
  onExportCSV,
  showExportButton = false
}) => {
  // URL search parameters for persistent state
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Search and filter states - initialize from URL params
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiRecipients, setApiRecipients] = useState<GroupMember[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Initialize state from URL parameters when modal opens
  useEffect(() => {
    if (isOpen && campaignId) {
      const urlSearch = searchParams.get('recipientSearch') || '';
      const urlStatus = searchParams.get('recipientStatus') || 'all';
      const urlPage = parseInt(searchParams.get('recipientPage') || '1');
      
      console.log('🔍 RecipientListModal - Initializing from URL params:', { urlSearch, urlStatus, urlPage });
      
      setSearchTerm(urlSearch);
      setStatusFilter(urlStatus);
      setPagination(prev => ({ ...prev, page: urlPage }));
    } else if (!isOpen) {
      // Clear URL params when modal closes
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('recipientSearch');
      newParams.delete('recipientStatus');
      newParams.delete('recipientPage');
      setSearchParams(newParams, { replace: true });
    }
  }, [isOpen, campaignId, searchParams, setSearchParams]);

  // Update URL parameters when search/filter state changes
  useEffect(() => {
    if (!isOpen || !campaignId) return;
    
    const newParams = new URLSearchParams(searchParams);
    
    if (searchTerm.trim()) {
      newParams.set('recipientSearch', searchTerm.trim());
    } else {
      newParams.delete('recipientSearch');
    }
    
    if (statusFilter && statusFilter !== 'all') {
      newParams.set('recipientStatus', statusFilter);
    } else {
      newParams.delete('recipientStatus');
    }
    
    if (pagination.page > 1) {
      newParams.set('recipientPage', pagination.page.toString());
    } else {
      newParams.delete('recipientPage');
    }
    
    console.log('🔍 RecipientListModal - Updating URL params:', { 
      search: searchTerm, 
      status: statusFilter, 
      page: pagination.page 
    });
    
    setSearchParams(newParams, { replace: true });
  }, [searchTerm, statusFilter, pagination.page, isOpen, campaignId, searchParams, setSearchParams]);

  // Use API recipients if campaignId is provided, otherwise use prop recipients
  const currentRecipients = campaignId ? apiRecipients : recipients;
  
  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch recipients from API when campaignId is available
  const fetchRecipients = useCallback(async () => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      console.log('🔍 Frontend RecipientListModal - Fetching recipients with:', { 
        search: debouncedSearchTerm, 
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: pagination.page 
      });
      
      const response = await campaignsAPI.searchCampaignRecipients(campaignId, {
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: pagination.page,
        limit: pagination.limit
      });
      
      console.log('🔍 Frontend RecipientListModal - API response:', response);
      setApiRecipients(response.recipients);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      setApiRecipients([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, debouncedSearchTerm, statusFilter, pagination.page, pagination.limit]);

  // Fetch recipients when modal opens or filters change
  useEffect(() => {
    if (isOpen && campaignId) {
      fetchRecipients();
    }
  }, [isOpen, fetchRecipients]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearchTerm, statusFilter]);

  // Get recipients with proper name formatting
  const actualRecipients = useMemo(() => {
    return currentRecipients.map(recipient => ({
      ...recipient,
      name: recipient.name || `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim()
    }));
  }, [currentRecipients]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = actualRecipients.length;
    const received = actualRecipients.filter(r => r.status === 'delivered' || r.status === 'read').length;
    const failed = actualRecipients.filter(r => r.status === 'failed').length;
    const successRate = total > 0 ? Math.round((received / total) * 100) : 0;
    
    return { total, received, failed, successRate };
  }, [actualRecipients]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Received</p>
              <p className="text-2xl font-bold text-green-600">{stats.received}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800"
            >
              <Filter className="h-4 w-4" />
              <span>Advanced Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  console.log('🔍 RecipientListModal - Clearing all filters and resetting pagination');
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Advanced Filter Options */}
          {showAdvanced && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                    <option value="read">Read</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Results Summary */}
          {campaignId && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {loading ? 'Loading...' : `Showing ${actualRecipients.length} of ${pagination.total} recipients`}
              </span>
              {pagination.totalPages > 1 && (
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Recipients Table */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b bg-indigo-50">
            <h3 className="text-lg font-semibold text-gray-900">Recipients</h3>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            {actualRecipients.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No recipients found
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-indigo-50">
                  <tr className="border-b">
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Phone</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Error Details</th>
                  </tr>
                </thead>
                <tbody>
                  {actualRecipients.map((recipient) => (
                    <tr key={recipient.mrId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-6 text-sm text-gray-900">{recipient.name}</td>
                      <td className="py-3 px-6 text-sm text-gray-900">{recipient.phone}</td>
                      <td className="py-3 px-6 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          recipient.status === 'read'
                            ? 'bg-green-200 text-green-900'
                            : recipient.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : recipient.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : recipient.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {recipient.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-sm max-w-xs">
                        {recipient.status === 'failed' && (recipient.errorMessage || recipient.errorCode) ? (
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div 
                                className="text-red-700 text-xs cursor-help" 
                                title={getErrorTooltip(recipient.errorCode)}
                              >
                                {formatErrorMessage(recipient.errorMessage, recipient.errorCode, recipient.errorTitle)}
                              </div>
                              {recipient.errorDetails && (
                                <div className="text-gray-500 text-xs mt-1">
                                  {recipient.errorDetails}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : recipient.status === 'failed' ? (
                          <span className="text-red-600 text-xs">Failed (No details)</span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {campaignId && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1 || loading}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.page - 2) + i;
                    if (pageNum > pagination.totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        disabled={loading}
                        className={`px-3 py-1 border rounded-md text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages || loading}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Export Button */}
        {showExportButton && onExportCSV && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Export to CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipientListModal;