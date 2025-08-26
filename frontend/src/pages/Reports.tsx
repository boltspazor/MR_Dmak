import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { api } from '../lib/api';
import { Campaign, Group } from '../types';

const Reports: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [campaignStats, setCampaignStats] = useState<any>(null);
  const [groupStats, setGroupStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const [campaignsRes, groupsRes, statsRes] = await Promise.all([
        api.get('/messages/campaigns'),
        api.get('/groups'),
        api.get('/reports/dashboard')
      ]);

      setCampaigns(campaignsRes.data.data || []);
      setGroups(groupsRes.data.data || []);
      setCampaignStats(statsRes.data.stats || {});
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupStats = async (groupId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get(`/groups/${groupId}/stats`);
      setGroupStats(response.data.stats);
    } catch (error: any) {
      console.error('Error fetching group stats:', error);
    }
  };

  const exportReport = async (format: 'json' | 'csv' = 'csv') => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      if (selectedCampaign) {
        const response = await api.get(`/reports/campaign/${selectedCampaign}/export?format=${format}`, {
          responseType: format === 'csv' ? 'blob' : 'json'
        });

        if (format === 'csv') {
          const url = window.URL.createObjectURL(response.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = `campaign-report-${selectedCampaign}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          const dataStr = JSON.stringify(response.data, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = window.URL.createObjectURL(dataBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `campaign-report-${selectedCampaign}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      } else {
        // Export overall dashboard report
        const response = await api.get('/reports/dashboard');
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  const getSuccessRate = (sent: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((sent / total) * 100);
  };

  const getStatusCount = (status: string) => {
    return campaigns.filter(c => c.status === status).length;
  };

  const getTotalRecipients = () => {
    return campaigns.reduce((acc, c) => acc + c.totalRecipients, 0);
  };

  const getTotalSent = () => {
    return campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  };

  const getTotalFailed = () => {
    return campaigns.reduce((acc, c) => acc + c.failedCount, 0);
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-32 border border-gray-200"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Comprehensive insights into your messaging campaigns</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => exportReport('csv')}
              variant="outline"
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={() => exportReport('json')}
              variant="outline"
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button
              onClick={fetchData}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-semibold text-gray-900">{campaigns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                  <p className="text-2xl font-semibold text-gray-900">{getTotalRecipients()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {getSuccessRate(getTotalSent(), getTotalRecipients())}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sent</p>
                  <p className="text-2xl font-semibold text-gray-900">{getTotalSent()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Campaign Status Overview</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Completed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{getStatusCount('completed')}</span>
                    <span className="text-xs text-gray-400">
                      ({getStatusCount('completed') > 0 ? Math.round((getStatusCount('completed') / campaigns.length) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">In Progress</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{getStatusCount('sending')}</span>
                    <span className="text-xs text-gray-400">
                      ({getStatusCount('sending') > 0 ? Math.round((getStatusCount('sending') / campaigns.length) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-gray-900">Failed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{getStatusCount('failed')}</span>
                    <span className="text-xs text-gray-400">
                      ({getStatusCount('failed') > 0 ? Math.round((getStatusCount('failed') / campaigns.length) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-900">Pending</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{getStatusCount('pending')}</span>
                    <span className="text-xs text-gray-400">
                      ({getStatusCount('pending') > 0 ? Math.round((getStatusCount('pending') / campaigns.length) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Message Delivery Rate</span>
                    <span>{getSuccessRate(getTotalSent(), getTotalRecipients())}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${getSuccessRate(getTotalSent(), getTotalRecipients())}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Failure Rate</span>
                    <span>{getSuccessRate(getTotalFailed(), getTotalRecipients())}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${getSuccessRate(getTotalFailed(), getTotalRecipients())}%`
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{getTotalSent()}</p>
                      <p className="text-sm text-gray-600">Messages Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{getTotalFailed()}</p>
                      <p className="text-sm text-gray-600">Messages Failed</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Campaign Reports</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Campaign</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.content.slice(0, 50)}... ({campaign.status})
                    </option>
                  ))}
                </select>
                {selectedCampaign && (
                  <Button
                    onClick={() => exportReport('csv')}
                    size="sm"
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedCampaign ? (
              <div className="space-y-4">
                {(() => {
                  const campaign = campaigns.find(c => c.id === selectedCampaign);
                  if (!campaign) return null;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{campaign.totalRecipients}</p>
                        <p className="text-sm text-blue-600">Total Recipients</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{campaign.sentCount}</p>
                        <p className="text-sm text-green-600">Successfully Sent</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{campaign.failedCount}</p>
                        <p className="text-sm text-red-600">Failed</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a campaign to view detailed report</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Performance */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Group Performance</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groups.map(group => (
                <div key={group.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{group.groupName}</p>
                      <p className="text-sm text-gray-600">{group.mrCount || 0} Medical Representatives</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {group.mrCount || 0}
                      </p>
                      <p className="text-xs text-gray-500">Total MRs</p>
                    </div>
                    <Button
                      onClick={() => fetchGroupStats(group.id)}
                      size="sm"
                      variant="outline"
                    >
                      View Stats
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Filter by Date Range</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    // Filter campaigns by date range
                    console.log('Filtering by date range:', dateRange);
                  }}
                  className="flex items-center"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;
