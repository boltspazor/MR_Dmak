import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Activity,
  BarChart3,
  LogOut,
  Shield,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found, redirecting to login');
        setLoading(false);
        return;
      }
      
      console.log('Fetching dashboard stats with token:', token.substring(0, 20) + '...');
      
      // Fetch dashboard stats and recent campaigns
      const [statsResponse, campaignsResponse, groupsResponse] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/messages/campaigns'),
        api.get('/groups')
      ]);

      const statsData = statsResponse.data.stats || {};
      const campaigns = campaignsResponse.data.data || [];
      const groups = groupsResponse.data.data || [];

      // Transform data for dashboard display
      const dashboardStats: DashboardStats = {
        totalMRs: statsData.totalMRs || 0,
        totalGroups: groups.length,
        totalCampaigns: campaigns.length,
        recentCampaigns: campaigns.slice(0, 5).map((campaign: any) => ({
          id: campaign.id,
          content: campaign.content,
          status: campaign.status,
          createdAt: campaign.createdAt,
          targetGroups: campaign.targetGroups,
          totalRecipients: campaign.totalRecipients,
          sentCount: campaign.sentCount,
          failedCount: campaign.failedCount
        })),
        groupStats: groups.map((group: any) => ({
          groupName: group.groupName,
          mrCount: group.mrCount || 0
        }))
      };

      setStats(dashboardStats);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      
      // Handle different error types
      if (error.response?.status === 401) {
        console.log('Unauthorized - redirecting to login');
        // Don't show error for unauthorized users
      } else if (error.response?.status === 500) {
        console.error('Server error - check Railway backend logs');
        // You might want to show a user-friendly message here
      } else {
        console.error('Dashboard API error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3, active: true },
    { path: '/simple-tool', label: 'DMak Tool', icon: BarChart3 },
    { path: '/groups', label: 'Groups', icon: Users },
    { path: '/mrs', label: 'Medical Items', icon: FileText },
    { path: '/campaigns', label: 'Campaigns', icon: MessageSquare },
    { path: '/templates', label: 'Templates', icon: FileText },
    { path: '/super-admin', label: 'Manager', icon: Shield },
    { path: '/reports', label: 'Reports', icon: Activity },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="w-64 bg-gradient-to-b from-purple-900 to-blue-900"></div>
        <div className="flex-1 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-32 border border-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 dmak-sidebar text-white relative">
        <div className="p-6">
          <div className="dmak-logo">
            <div className="dmak-logo-icon">
              <BarChart3 className="h-5 w-5 text-purple-900" />
            </div>
            <span className="dmak-logo-text">DMak</span>
          </div>
          
          <nav className="space-y-2">
            {navItems.map(({ path, label, icon: Icon, active }) => (
              <Link
                key={path}
                to={path}
                className={`dmak-nav-item ${active ? 'active' : ''}`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="absolute bottom-6 left-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => logout()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-6 right-6">
          <img 
            src="/dvk-simple.svg" 
            alt="DVK" 
            className="w-22 h-20"
            style={{ width: '68px', height: '57px' }}
            onError={(e) => {
              console.error('Failed to load DVK logo:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 relative">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="dmak-main-title">DMak</h1>
              <p className="dmak-subtitle">
                Digital - Marketing, Automate And Konnect.
              </p>
              <p className="dmak-description">
                Manage your Medical Representatives and messaging campaigns efficiently.
              </p>
            </div>
            <div className="flex space-x-4">
              <Link to="/campaigns">
                <button className="dmak-button-primary">
                  New Campaign
                </button>
              </Link>
              <Link to="/mrs">
                <button className="dmak-button-primary">
                  Add Medical Representative
                </button>
              </Link>
            </div>
          </div>

            {/* Glenmark Logo */}
            <div className="absolute top-6 right-8">
              <img 
                src="/glenmark-simple.svg" 
                alt="Glenmark" 
                className="w-35 h-20"
                style={{ width: '140px', height: '79px' }}
                onError={(e) => {
                  console.error('Failed to load Glenmark logo:', e);
                  e.currentTarget.style.display = 'none';
                  // Show fallback text
                  const fallback = document.createElement('div');
                  fallback.textContent = 'Glenmark';
                  fallback.style.cssText = 'color: #000; font-weight: bold; font-size: 14px;';
                  e.currentTarget.parentNode?.appendChild(fallback);
                }}
              />
            </div>
        </div>

        {/* Stats Cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="dmak-stats-card">
              <h3 className="dmak-stats-title">Total Medical Representatives</h3>
              <p className="dmak-stats-value">{stats?.totalMRs || 5}</p>
            </div>
            <div className="dmak-stats-card">
              <h3 className="dmak-stats-title">Total Groups</h3>
              <p className="dmak-stats-value">{stats?.totalGroups || 3}</p>
            </div>
            <div className="dmak-stats-card">
              <h3 className="dmak-stats-title">Total Campaigns</h3>
              <p className="dmak-stats-value">{stats?.totalCampaigns || 6}</p>
            </div>
            <div className="dmak-stats-card">
              <h3 className="dmak-stats-title">Growth Rate</h3>
              <p className="dmak-stats-value">5%</p>
            </div>
          </div>

          {/* Bottom Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Campaigns */}
            <div className="dmak-section-card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="dmak-section-title">Recent Campaigns</h2>
                <div className="flex space-x-2">
                  <Link to="/campaigns">
                    <button className="dmak-button-secondary">
                      Create New
                    </button>
                  </Link>
                </div>
              </div>
              <div className="space-y-3">
                {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
                  stats.recentCampaigns.slice(0, 3).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {campaign.content.slice(0, 40)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                        campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No campaigns yet</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link to="/campaigns">
                  <button className="dmak-button-secondary">
                    View All
                  </button>
                </Link>
              </div>
            </div>

            {/* Group Statistics */}
            <div className="dmak-section-card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="dmak-section-title">Group Statistics</h2>
                <div className="flex space-x-2">
                  <Link to="/groups">
                    <button className="dmak-button-secondary">
                      Create New
                    </button>
                  </Link>
                </div>
              </div>
              <div className="space-y-3">
                {stats?.groupStats && stats.groupStats.length > 0 ? (
                  stats.groupStats.slice(0, 3).map((group, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm font-medium text-gray-900">{group.groupName}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{group.mrCount} MRs</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (group.mrCount / (stats?.totalMRs || 1)) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No groups yet</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link to="/groups">
                  <button className="dmak-button-secondary">
                    View All
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
