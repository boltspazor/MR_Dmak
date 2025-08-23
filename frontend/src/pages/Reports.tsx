import React, { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import reportsService from '../services/reports.service';
import messagesService from '../services/messages.service';
import { MessageCampaign, DetailedCampaignReport } from '../types';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import CampaignReportModal from '../components/messages/CampaignReportModal';

const Reports: React.FC = () => {
  const { addNotification } = useNotifications();
  const [campaigns, setCampaigns] = useState<MessageCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<MessageCampaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await messagesService.getAllCampaigns({ 
        search: searchTerm,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      });
      setCampaigns(response.data || []);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to load campaigns',
        message: error.response?.data?.error || 'Could not load campaigns for reports',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (campaignId: string, format: 'json' | 'csv') => {
    try {
      await reportsService.exportReport(campaignId, format);
      addNotification({
        type: 'success',
        title: 'Export Successful',
        message: `Campaign report exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error.response?.data?.error || 'Could not export campaign report',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <ClockIcon className="h-5 w-5 text-warning-500" />;
      case 'processing':
        return <ChartBarIcon className="h-5 w-5 text-primary-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-danger-500" />;
      default:
        return <ChartBarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return <span className="badge badge-warning">Queued</span>;
      case 'processing':
        return <span className="badge badge-info">Processing</span>;
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'failed':
        return <span className="badge badge-danger">Failed</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">View detailed reports and analytics for your campaigns</p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Search Campaigns</label>
              <input
                type="text"
                placeholder="Search by content or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="form-label">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="form-label">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={fetchCampaigns}
              className="btn btn-primary"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || dateFrom || dateTo ? 'No campaigns match your filters.' : 'No campaigns available for reporting.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(campaign.status)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {campaign.message.content.length > 50 
                            ? `${campaign.message.content.substring(0, 50)}...`
                            : campaign.message.content
                          }
                        </h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          {getStatusBadge(campaign.status)}
                          <span>•</span>
                          <span>{campaign._count?.messageLogs || 0} recipients</span>
                          <span>•</span>
                          <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                          {campaign.scheduledAt && (
                            <>
                              <span>•</span>
                              <span>Scheduled: {new Date(campaign.scheduledAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {campaign.message.imageUrl && (
                      <div className="mt-3">
                        <img 
                          src={campaign.message.imageUrl} 
                          alt="Message attachment"
                          className="h-20 w-20 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowReportModal(true);
                      }}
                      className="btn btn-sm btn-secondary"
                      title="View Detailed Report"
                    >
                      <ChartBarIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleExportReport(campaign.id, 'csv')}
                      className="btn btn-sm btn-secondary"
                      title="Export as CSV"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      <CampaignReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setSelectedCampaign(null);
        }}
        campaignId={selectedCampaign?.id}
      >
        <div></div>
      </CampaignReportModal>
    </div>
  );
};

export default Reports;
