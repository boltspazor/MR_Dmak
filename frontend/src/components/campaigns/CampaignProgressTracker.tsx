import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, Users, AlertCircle } from 'lucide-react';
import { campaignProgressAPI, CampaignProgress } from '../../api/campaign-progress';
import { formatErrorMessage, getErrorTooltip } from '../../utils/whatsappErrorCodes';
import toast from 'react-hot-toast';

interface CampaignProgressTrackerProps {
  campaignId: string;
  onClose?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ProgressStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  successRate: number;
}

const CampaignProgressTracker: React.FC<CampaignProgressTrackerProps> = ({
  campaignId,
  onClose,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProgress = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      const data = await campaignProgressAPI.getCampaignProgress(campaignId);
      setProgress(data);
    } catch (err: any) {
      console.error('Error fetching campaign progress:', err);
      setError(err.response?.data?.message || 'Failed to fetch campaign progress');
      toast.error('Failed to fetch campaign progress');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [campaignId]);

  // Auto-refresh effect
  useEffect(() => {
    fetchProgress();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchProgress(true);
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [fetchProgress, autoRefresh, refreshInterval]);

  const handleRefresh = () => {
    fetchProgress(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'read':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'read':
        return 'bg-green-200 text-green-900 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredRecipients = progress?.recipients.filter(recipient => {
    const matchesFilter = filter === 'all' || recipient.status === filter;
    const matchesSearch = searchTerm === '' || 
      recipient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.mrId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.phone.includes(searchTerm);
    return matchesFilter && matchesSearch;
  }) || [];

  const CircularProgress: React.FC<{ progress: ProgressStats }> = ({ progress }) => {
    const radius = 80;
    const strokeWidth = 12;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (progress.successRate / 100) * circumference;

    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke="#10b981"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-900">
            {Math.round(progress.successRate)}%
          </div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Progress</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">{progress.campaign.name}</h2>
            <p className="text-indigo-100">
              Campaign ID: {progress.campaign.campaignId}
            </p>
            {progress.template && (
              <p className="text-indigo-100 text-sm mt-1">
                Template: {progress.template.name} ({progress.template.type})
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Circular Progress */}
          <div className="flex flex-col items-center">
            <CircularProgress progress={progress.progress} />
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Last updated: {new Date(progress.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-900">
                    {progress.progress.sent}
                  </div>
                  <div className="text-sm text-green-700">Sent</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center">
                <XCircle className="w-8 h-8 text-red-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-red-900">
                    {progress.progress.failed}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {progress.progress.pending}
                  </div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {progress.progress.total}
                  </div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recipients List */}
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">
              Recipients ({filteredRecipients.length})
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search recipients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Recipients Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MR ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecipients.map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(recipient.status)}`}>
                        {getStatusIcon(recipient.status)}
                        <span className="ml-1 capitalize">{recipient.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {recipient.mrId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {recipient.firstName} {recipient.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {recipient.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.group}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {recipient.sentAt ? new Date(recipient.sentAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs">
                      {recipient.status === 'failed' && (recipient.errorMessage || recipient.errorCode) ? (
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div 
                              className="text-red-700 text-xs cursor-help break-words" 
                              title={getErrorTooltip(recipient.errorCode)}
                            >
                              {formatErrorMessage(recipient.errorMessage, recipient.errorCode, recipient.errorTitle)}
                            </div>
                            {recipient.errorDetails && (
                              <div className="text-gray-500 text-xs mt-1 break-words">
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
          </div>

          {filteredRecipients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recipients found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignProgressTracker;
