import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, Clock, AlertCircle, Users, Send, RefreshCw } from 'lucide-react';
import { WizardCampaign } from '../../pages/CampaignWizard';

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
  stepNumber,
  stepTitle,
  stepDescription,
  createdCampaign,
  campaignProgress,
  setCampaignProgress
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);

  // Simulate campaign progress
  useEffect(() => {
    if (createdCampaign && campaignProgress.total > 0 && !simulationComplete) {
      simulateProgress();
    }
  }, [createdCampaign, campaignProgress.total, simulationComplete]);

  const simulateProgress = async () => {
    setIsSimulating(true);
    
    // Simulate sending messages over time
    for (let i = 0; i < campaignProgress.total; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay per message
      
      setCampaignProgress(prev => {
        const newProgress = { ...prev };
        newProgress.pending = Math.max(0, newProgress.pending - 1);
        
        // 80% success rate simulation
        if (Math.random() > 0.2) {
          newProgress.sent += 1;
        } else {
          newProgress.failed += 1;
        }
        
        return newProgress;
      });
    }
    
    setIsSimulating(false);
    setSimulationComplete(true);
  };

  const handleRefresh = () => {
    if (createdCampaign) {
      // Reset and restart simulation
      setCampaignProgress({
        total: createdCampaign.selectedMRs.length,
        sent: 0,
        failed: 0,
        pending: createdCampaign.selectedMRs.length
      });
      setSimulationComplete(false);
    }
  };

  const getProgressPercentage = () => {
    if (campaignProgress.total === 0) return 0;
    return Math.round(((campaignProgress.sent + campaignProgress.failed) / campaignProgress.total) * 100);
  };

  const getStatusColor = () => {
    if (simulationComplete) {
      return campaignProgress.failed === 0 ? 'text-green-600' : 'text-yellow-600';
    }
    return 'text-blue-600';
  };

  const getStatusText = () => {
    if (simulationComplete) {
      return campaignProgress.failed === 0 ? 'Completed Successfully' : 'Completed with Issues';
    }
    return isSimulating ? 'Sending Messages...' : 'Ready to Send';
  };

  const getStatusIcon = () => {
    if (simulationComplete) {
      return campaignProgress.failed === 0 ? CheckCircle : AlertCircle;
    }
    return isSimulating ? RefreshCw : Send;
  };

  const StatusIcon = getStatusIcon();

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
          <h3 className="text-lg font-semibold text-gray-900">Progress Overview</h3>
          <button
            onClick={handleRefresh}
            disabled={isSimulating}
            className="text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
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

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Sent</p>
                <p className="text-2xl font-bold text-green-600">{campaignProgress.sent}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-900">Failed</p>
                <p className="text-2xl font-bold text-red-600">{campaignProgress.failed}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{campaignProgress.pending}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Status</h3>
        
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <div className={`p-2 rounded-lg ${isSimulating ? 'bg-blue-100' : simulationComplete ? 'bg-green-100' : 'bg-gray-100'}`}>
            <StatusIcon className={`w-6 h-6 ${getStatusColor()} ${isSimulating ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1">
            <p className={`font-medium ${getStatusColor()}`}>{getStatusText()}</p>
            <p className="text-sm text-gray-600">
              {isSimulating 
                ? `Sending message ${campaignProgress.sent + campaignProgress.failed + 1} of ${campaignProgress.total}...`
                : simulationComplete
                ? `Campaign completed. ${campaignProgress.sent} sent, ${campaignProgress.failed} failed.`
                : 'Ready to start sending messages.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Success Rate */}
      {campaignProgress.sent + campaignProgress.failed > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Rate</h3>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Delivery Success Rate</span>
                <span className="text-sm text-gray-600">
                  {Math.round((campaignProgress.sent / (campaignProgress.sent + campaignProgress.failed)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(campaignProgress.sent / (campaignProgress.sent + campaignProgress.failed)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {simulationComplete && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Campaign Completed!</h4>
              <p className="text-sm text-green-800 mt-1">
                Your campaign has been successfully processed. 
                {campaignProgress.failed > 0 && ` ${campaignProgress.failed} messages failed to send.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 What's Next?</h4>
        <p className="text-sm text-blue-800">
          {simulationComplete 
            ? "Your campaign is complete! You can now go to the dashboard to view detailed reports and create new campaigns."
            : isSimulating
            ? "Your campaign is being processed. You can monitor the progress in real-time above."
            : "Click 'Refresh' to start the campaign simulation, or proceed to the dashboard to manage your campaigns."
          }
        </p>
      </div>
    </div>
  );
};

export default StepThreeProgressCheck;
