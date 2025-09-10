import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Download,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image,
  BarChart3
} from 'lucide-react';
import { api } from '../lib/api';
import { Campaign, Group } from '../types';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import { useAuth } from '../contexts/AuthContext';

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    content: '',
    targetGroups: [] as string[],
    imageUrl: '',
    scheduledAt: ''
  });

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchGroups();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get('/messages/campaigns');
      setCampaigns(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const campaignData = {
        ...formData,
        targetGroups: formData.targetGroups
      };

      if (editingCampaign) {
        await api.put(`/messages/campaigns/${editingCampaign.id}`, campaignData);
      } else {
        await api.post('/messages/campaigns', campaignData);
      }

      await fetchCampaigns();
      setShowCreateForm(false);
      setEditingCampaign(null);
      setFormData({
        content: '',
        targetGroups: [],
        imageUrl: '',
        scheduledAt: ''
      });
      setImageFile(null);
      setImagePreview('');
      setUploadSuccess(false);
    } catch (error: any) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      content: campaign.content,
      targetGroups: campaign.targetGroups,
      imageUrl: campaign.imageUrl || '',
      scheduledAt: campaign.scheduledAt || ''
    });
    setImagePreview(campaign.imageUrl || '');
    setImageFile(null);
    setUploadSuccess(false);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await api.delete(`/messages/campaigns/${id}`);
      await fetchCampaigns();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sending':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportCampaignsToCSV = () => {
    const csvContent = [
      'Campaign ID,Content,Target Groups,Status,Total Recipients,Sent Count,Failed Count,Created At',
      ...campaigns.map(campaign => 
        `${campaign.id},${campaign.content.slice(0, 50)}...,${campaign.targetGroups.join('; ')},${campaign.status},${campaign.totalRecipients},${campaign.sentCount},${campaign.failedCount},${new Date(campaign.createdAt).toLocaleDateString()}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaigns.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportCampaignsToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableContent = `
        <html>
          <head>
            <title>Campaigns Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <h1>Campaigns Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Campaign ID</th>
                  <th>Content</th>
                  <th>Target Groups</th>
                  <th>Status</th>
                  <th>Total Recipients</th>
                  <th>Sent Count</th>
                  <th>Failed Count</th>
                </tr>
              </thead>
              <tbody>
                ${campaigns.map(campaign => `
                  <tr>
                    <td>${campaign.id}</td>
                    <td>${campaign.content.substring(0, 50)}...</td>
                    <td>${campaign.targetGroups.join(', ')}</td>
                    <td>${campaign.status}</td>
                    <td>${campaign.totalRecipients}</td>
                    <td>${campaign.sentCount}</td>
                    <td>${campaign.failedCount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(tableContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = 
      campaign.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.targetGroups.some(group => group.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !selectedStatus || campaign.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Navigation functions
  const handleSidebarNavigation = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const summaryItems = [
    {
      title: 'Total Campaigns',
      value: campaigns.length,
      icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'Completed',
      value: campaigns.filter(c => c.status === 'completed').length,
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100'
    },
    {
      title: 'Pending',
      value: campaigns.filter(c => c.status === 'pending').length,
      icon: <Clock className="h-6 w-6 text-orange-600" />,
      color: 'bg-orange-100'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-32 border border-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        activePage="campaigns"
        onNavigate={handleSidebarNavigation}
        onLogout={handleLogout}
        userName={user?.name || "User"}
      />

      {/* Main Content */}
      <div className="ml-24 p-8">
        {/* Header */}
        <Header 
          title="Message Campaigns"
          subtitle="Manage and track your messaging campaigns"
          onExportCSV={exportCampaignsToCSV}
          onExportPDF={exportCampaignsToPDF}
          showExportButtons={false}
        />
        
        {/* Separator Line */}
        <div className="border-b border-gray-300 my-6"></div>

        {/* Main Content Area */}
        <CommonFeatures
          summaryItems={summaryItems}
          onExportCSV={exportCampaignsToCSV}
          onExportPDF={exportCampaignsToPDF}
        >
          <div className="space-y-8">
            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Message Campaigns</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowCreateForm(true);
                    setEditingCampaign(null);
                    setFormData({
                      content: '',
                      targetGroups: [],
                      imageUrl: '',
                      scheduledAt: ''
                    });
                    setImageFile(null);
                    setImagePreview('');
                    setUploadSuccess(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                >
                  New Campaign
                </button>
              </div>
            </div>

            {/* Campaigns Table */}
            <div className="bg-white bg-opacity-40 rounded-lg">
              {/* Table Header */}
              <div className="p-6 border-b bg-indigo-50">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">All Campaigns</h2>
                  <span className="text-sm text-gray-700 font-bold">
                    {filteredCampaigns.length} Campaigns
                  </span>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search campaigns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border-0 bg-gray-100"
                    />
                  </div>
                  
                  <div className="relative">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-0 bg-gray-100"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="sending">Sending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-indigo-50 border-b">
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Content</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Target Groups</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Status</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Recipients</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Progress</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Created</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.length > 0 ? (
                      filteredCampaigns.map(campaign => (
                        <tr key={campaign.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-6 text-sm text-gray-900">
                            <div className="max-w-xs truncate">
                              {campaign.content.substring(0, 50)}...
                            </div>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            {campaign.targetGroups.join(', ')}
                          </td>
                          <td className="py-3 px-6 text-sm text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                              {getStatusIcon(campaign.status)}
                              <span className="ml-1">{campaign.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            {campaign.totalRecipients}
                          </td>
                          <td className="py-3 px-6 text-sm text-center">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full" 
                                style={{ width: `${(campaign.sentCount / campaign.totalRecipients) * 100}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {campaign.sentCount}/{campaign.totalRecipients}
                            </div>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-6 text-sm text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleEdit(campaign)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit Campaign"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(campaign.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete Campaign"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                              <MessageSquare className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-indigo-600">
                              No Campaigns Found
                            </h3>
                            <p className="text-sm text-indigo-600">
                              Get started by creating your first campaign
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CommonFeatures>

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Content *
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={4}
                    maxLength={1000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Enter your message content..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-sm ${formData.content.length > 900 ? 'text-red-600' : 'text-gray-500'}`}>
                      {formData.content.length}/1000 characters
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Groups *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {groups.map(group => (
                      <label key={group.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.targetGroups.includes(group.groupName)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                targetGroups: [...formData.targetGroups, group.groupName]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                targetGroups: formData.targetGroups.filter(g => g !== group.groupName)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{group.groupName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter image URL..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled At
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingCampaign(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;