import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCircle, 
  MessageSquare, 
  TrendingUp,
  Plus,
  ArrowRight,
  Activity
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { api } from '../lib/api';
import { DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }
      
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
      // Don't show error for unauthorized users
      if (error.response?.status !== 401) {
        console.error('Dashboard API error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-32 border border-gray-200"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: 'Total Medical Reps',
      value: stats?.totalMRs || 0,
      icon: UserCircle,
      color: 'text-blue-600 bg-blue-50',
      href: '/mrs'
    },
    {
      title: 'Total Groups',
      value: stats?.totalGroups || 0,
      icon: Users,
      color: 'text-green-600 bg-green-50',
      href: '/groups'
    },
    {
      title: 'Total Campaigns',
      value: stats?.totalCampaigns || 0,
      icon: MessageSquare,
      color: 'text-purple-600 bg-purple-50',
      href: '/campaigns'
    },
    {
      title: 'Growth Rate',
      value: '12%',
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-50',
      href: '/reports'
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome to MR Manager</h1>
          <p className="text-blue-100">
            Manage your medical representatives and messaging campaigns efficiently
          </p>
          <div className="flex space-x-4 mt-4">
            <Link to="/mrs">
              <Button variant="outline" className="bg-white text-blue-600 hover:bg-gray-50 border-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Medical Rep
              </Button>
            </Link>
            <Link to="/campaigns">
              <Button variant="outline" className="bg-white text-blue-600 hover:bg-gray-50 border-white">
                <MessageSquare className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Link key={stat.title} to={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Campaigns */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Campaigns</h2>
                <Link to="/campaigns">
                  <Button variant="outline" size="sm">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentCampaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
                      {/* Campaign Image */}
                      {campaign.imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={campaign.imageUrl}
                            alt="Campaign"
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {campaign.content.slice(0, 50)}...
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                        {campaign.totalRecipients && (
                          <p className="text-xs text-gray-400 mt-1">
                            {campaign.sentCount || 0}/{campaign.totalRecipients} sent
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                          campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No campaigns yet</p>
                  <Link to="/campaigns">
                    <Button className="mt-2" size="sm">Create First Campaign</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Group Statistics */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Group Statistics</h2>
                <Link to="/groups">
                  <Button variant="outline" size="sm">
                    Manage groups
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.groupStats && stats.groupStats.length > 0 ? (
                <div className="space-y-3">
                  {stats.groupStats.slice(0, 5).map((group, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{group.groupName}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{group.mrCount} MRs</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (group.mrCount / (stats?.totalMRs || 1)) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No groups yet</p>
                  <Link to="/groups">
                    <Button className="mt-2" size="sm">Create First Group</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;