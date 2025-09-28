import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Users, RefreshCw, Eye } from 'lucide-react';
import { WizardCampaign } from '../../pages/CampaignWizard';
import { campaignProgressAPI, CampaignProgress } from '../../api/campaign-progress';
import MessageDetailsModal from './MessageDetailsModal';
import toast from 'react-hot-toast';

interface StepThreeProgressCheckProps {
  stepNumber: number;
  stepTitle: string;
  stepDescription: string;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  createdCampaign: WizardCampaign | null;
  campaignProgress: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  setCampaignProgress: (progress: any) => void;
}

const StepThreeProgressCheck: React.FC<StepThreeProgressCheckProps> = ({
  stepTitle,
  stepDescription,
  createdCampaign,
  campaignProgress,
  setCampaignProgress
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeProgress, setRealTimeProgress] = useState<CampaignProgress | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<'sent' | 'failed' | 'delivered' | 'read' | 'pending' | 'queued'>('sent');
  const [modalTitle, setModalTitle] = useState('');

  // Fetch real-time campaign progress from webhook data
  useEffect(() => {
    if (createdCampaign?.id) {
      fetchRealTimeProgress();
      
      // Set up auto-refresh every 5 seconds
      const interval = setInterval(() => {
        if (autoRefresh) {
          fetchRealTimeProgress();
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [createdCampaign?.id, autoRefresh]);

  const fetchRealTimeProgress = async () => {
    if (!createdCampaign?.id) return;

    try {
      setIsLoading(true);
      const progressData = await campaignProgressAPI.getCampaignProgress(createdCampaign.id);
      
      setRealTimeProgress(progressData);
      setLastUpdated(new Date());
      
      // Update the campaign progress state with real data
      setCampaignProgress({
        total: progressData.progress.total,
        sent: progressData.progress.sent,
        failed: progressData.progress.failed,
        pending: progressData.progress.pending
      });

    } catch (error: any) {
      console.error('Failed to fetch campaign progress:', error);
      
      // Don't show error toast on first load to avoid spamming
      if (lastUpdated) {
        toast.error(`Failed to fetch campaign progress: ${error.message || 'Unknown error'}`);
      }
      
      // Fallback: keep existing progress data if API fails
      // This ensures the component still works even if the API is down
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (createdCampaign?.id) {
      fetchRealTimeProgress();
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const openModal = (status: 'sent' | 'failed' | 'delivered' | 'read' | 'pending' | 'queued') => {
    setModalStatus(status);
    setModalTitle(`${status.charAt(0).toUpperCase() + status.slice(1)} Messages`);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const getProgressPercentage = () => {
    if (campaignProgress.total === 0) return 0;
    const processed = campaignProgress.sent + campaignProgress.failed;
    return Math.min(100, Math.round((processed / campaignProgress.total) * 100));
  };

  const getStatusColor = () => {
    if (campaignProgress.pending === 0) {
      return campaignProgress.failed === 0 ? 'text-green-600' : 'text-yellow-600';
    }
    return 'text-blue-600';
  };

  const getStatusText = () => {
    if (campaignProgress.pending === 0) {
      return campaignProgress.failed === 0 ? 'Completed Successfully' : 'Completed with Issues';
    }
    return isLoading ? 'Loading Status...' : 'In Progress';
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{stepTitle}</h2>
        <p className="mt-2 text-gray-600">{stepDescription}</p>
      </div>

      {/* Campaign Summary */}
      {createdCampaign && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Campaign Name</p>
              <p className="font-medium text-gray-900">{createdCampaign.campaignName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Recipients</p>
              <p className="font-medium text-gray-900">{campaignProgress.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`font-medium ${getStatusColor()}`}>{getStatusText()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium text-gray-900">
                {new Date(createdCampaign.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Progress Overview</h3>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleAutoRefresh}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700 border-green-200' 
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-600">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total</p>
                <p className="text-2xl font-bold text-blue-600">{campaignProgress.total}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => openModal('sent')}
            disabled={campaignProgress.sent === 0}
            className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Sent</p>
                  <p className="text-2xl font-bold text-green-600">{campaignProgress.sent}</p>
                </div>
              </div>
              {campaignProgress.sent > 0 && (
                <Eye className="w-4 h-4 text-green-600" />
              )}
            </div>
          </button>

          <button
            onClick={() => openModal('failed')}
            disabled={campaignProgress.failed === 0}
            className="bg-red-50 p-4 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-900">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{campaignProgress.failed}</p>
                </div>
              </div>
              {campaignProgress.failed > 0 && (
                <Eye className="w-4 h-4 text-red-600" />
              )}
            </div>
          </button>

          <button
            onClick={() => openModal('pending')}
            disabled={campaignProgress.pending === 0}
            className="bg-yellow-50 p-4 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{campaignProgress.pending}</p>
                </div>
              </div>
              {campaignProgress.pending > 0 && (
                <Eye className="w-4 h-4 text-yellow-600" />
              )}
            </div>
          </button>
        </div>
      </div>



      {/* Completion Message */}
      {campaignProgress.pending === 0 && campaignProgress.total > 0 && (
        <div className={`border rounded-lg p-6 ${
          campaignProgress.failed === 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center space-x-3">
            {campaignProgress.failed === 0 ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            )}
            <div>
              <h4 className={`font-medium ${
                campaignProgress.failed === 0 ? 'text-green-900' : 'text-yellow-900'
              }`}>
                Campaign Completed!
              </h4>
              <p className={`text-sm mt-1 ${
                campaignProgress.failed === 0 ? 'text-green-800' : 'text-yellow-800'
              }`}>
                Your campaign has been processed. 
                {campaignProgress.failed > 0 
                  ? ` ${campaignProgress.failed} messages failed to send.` 
                  : ' All messages sent successfully!'
                }
              </p>
              {realTimeProgress && (
                <p className="text-xs text-gray-600 mt-2">
                  Success rate: {realTimeProgress.progress.successRate}%
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Real-time Status Updates</h4>
        <p className="text-sm text-blue-800">
          {campaignProgress.pending === 0 && campaignProgress.total > 0
            ? "Your campaign is complete! You can now go to the dashboard to view detailed reports and create new campaigns."
            : campaignProgress.total > 0
            ? "Your campaign is being processed. Status updates are received in real-time from WhatsApp webhooks. You can monitor the progress above."
            : "Campaign data is being loaded. Once your campaign starts sending messages, you'll see real-time status updates here."
          }
        </p>
        {campaignProgress.total > 0 && (
          <div className="mt-3 text-xs text-blue-700">
            <p>• Status updates are received from WhatsApp Business API webhooks</p>
            <p>• Auto-refresh is enabled to show real-time progress</p>
            <p>• Data includes sent, delivered, read, and failed message statuses</p>
          </div>
        )}
      </div>

      {/* Message Details Modal */}
      {createdCampaign && (
        <MessageDetailsModal
          isOpen={modalOpen}
          onClose={closeModal}
          campaignId={createdCampaign.id}
          status={modalStatus}
          title={modalTitle}
        />
      )}
    </div>
  );
};

export default StepThreeProgressCheck;
