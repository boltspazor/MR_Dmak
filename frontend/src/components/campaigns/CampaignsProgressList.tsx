import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  TrendingUp, 
  Eye,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { useCampaignProgress } from '../../hooks/useCampaignProgress';
import CampaignProgressTracker from './CampaignProgressTracker';

interface CampaignsProgressListProps {
  onCampaignSelect?: (campaignId: string) => void;
  showFilters?: boolean;
  autoRefresh?: boolean;
}

const CampaignsProgressList: React.FC<CampaignsProgressListProps> = ({
  onCampaignSelect,
  showFilters = true,
  autoRefresh = true
}) => {
  const { campaigns, loading, refreshing, error, refreshCampaigns } = useCampaignProgress({
    autoRefresh
  });
  
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleCampaignClick = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    onCampaignSelect?.(campaignId);
  };

  const handleCloseTracker = () => {
    setSelectedCampaignId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      case 'sending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      case 'sending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (successRate: number) => {
    if (successRate >= 90) return 'text-green-600';
    if (successRate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.campaignId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading && campaigns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Campaigns</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshCampaigns}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Progress</h2>
            <p className="text-gray-600">Monitor your campaigns in real-time</p>
          </div>
          <button
            onClick={refreshCampaigns}
            disabled={refreshing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="sending">Sending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        )}
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Campaigns Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'No campaigns match your current filters.' 
                : 'You haven\'t created any campaigns yet.'}
            </p>
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleCampaignClick(campaign.campaignId)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      ID: {campaign.campaignId}
                    </p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                      {getStatusIcon(campaign.status)}
                      <span className="ml-1 capitalize">{campaign.status}</span>
                    </span>
                    <Eye className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Progress Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {campaign.progress.total}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {campaign.progress.sent}
                    </div>
                    <div className="text-sm text-gray-600">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {campaign.progress.failed}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getProgressColor(campaign.progress.successRate)}`}>
                      {Math.round(campaign.progress.successRate)}%
                    </div>
                    <div className="text-sm text-gray-600">Success</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${campaign.progress.successRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Campaign Progress Tracker Modal */}
      {selectedCampaignId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <CampaignProgressTracker
              campaignId={selectedCampaignId}
              onClose={handleCloseTracker}
              autoRefresh={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsProgressList;
