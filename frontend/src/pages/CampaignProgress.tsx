import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CampaignsProgressList from '../components/campaigns/CampaignsProgressList';
import CampaignProgressTracker from '../components/campaigns/CampaignProgressTracker';
import { Plus, BarChart3, Users, TrendingUp } from 'lucide-react';

const CampaignProgress: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showTracker, setShowTracker] = useState(false);

  const handleSidebarNavigation = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setShowTracker(true);
  };

  const handleCloseTracker = () => {
    setShowTracker(false);
    setSelectedCampaignId(null);
  };

  const handleCreateCampaign = () => {
    navigate('/campaigns');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          activePage="campaign-progress"
          onNavigate={handleSidebarNavigation}
          onLogout={handleLogout}
          userName={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).name : 'User'}
          userRole={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).role : 'User'}
        />

        {/* Main Content */}
        <div className="flex-1 ml-64">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Campaign Progress
                  </h1>
                  <p className="text-gray-600">
                    Monitor and track your campaign performance in real-time
                  </p>
                </div>
                <button
                  onClick={handleCreateCampaign}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Campaign
                </button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaigns Progress List */}
            <CampaignsProgressList
              onCampaignSelect={handleCampaignSelect}
              showFilters={true}
              autoRefresh={true}
            />
          </div>
        </div>
      </div>

      {/* Campaign Progress Tracker Modal */}
      {showTracker && selectedCampaignId && (
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

export default CampaignProgress;
