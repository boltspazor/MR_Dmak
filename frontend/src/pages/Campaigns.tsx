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
  BarChart3,
  Activity,
  LogOut,
  Shield,
  FileText
} from 'lucide-react';
import { api } from '../lib/api';
import { Campaign, Group } from '../types';

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
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
      const token = localStorage.getItem('authToken');
      if (!token) return;

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

      if (editingCampaign) {
        await api.put(`/messages/campaigns/${editingCampaign.id}`, formData);
      } else {
        await api.post('/messages/send', formData);
      }

      setFormData({
        content: '',
        targetGroups: [],
        imageUrl: '',
        scheduledAt: ''
      });
      setImageFile(null);
      setImagePreview('');
      setUploadSuccess(false);
      setEditingCampaign(null);
      setShowCreateForm(false);
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      alert(error.response?.data?.error || 'Failed to save campaign');
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.post('/messages/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setFormData(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
      setImagePreview(response.data.imageUrl);
      setImageFile(null);
      setUploadSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleDelete = async (campaignId: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await api.delete(`/messages/campaigns/${campaignId}`);
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      alert(error.response?.data?.error || 'Failed to delete campaign');
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

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#ECEAE2', width: '1440px', height: '1024px' }}>
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
    <div className="min-h-screen" style={{ background: '#ECEAE2', width: '1440px', height: '1024px' }}>
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-23 h-screen" style={{ background: '#2C2696', width: '92px' }}>
        <div className="flex flex-col items-center py-4 space-y-2">
          {/* Dashboard */}
          <button 
            onClick={() => handleSidebarNavigation('/dashboard')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <BarChart3 className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Dashboard</span>
          </button>
          
          {/* DMak Tool */}
          <button 
            onClick={() => handleSidebarNavigation('/simple-tool')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <BarChart3 className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>DMak Tool</span>
          </button>
          
          {/* Groups */}
          <button 
            onClick={() => handleSidebarNavigation('/groups')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <Users className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Groups</span>
          </button>
          
          {/* Medical Items */}
          <button 
            onClick={() => handleSidebarNavigation('/mrs')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <FileText className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Medical Items</span>
          </button>
          
          {/* Campaigns - Active */}
          <div className="flex flex-col items-center p-2 rounded-lg w-16 h-16 border border-gray-200" style={{ background: 'rgba(236, 234, 226, 0.1)' }}>
            <MessageSquare className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Campaigns</span>
          </div>
          
          {/* Templates */}
          <button 
            onClick={() => handleSidebarNavigation('/templates')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <FileText className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Templates</span>
          </button>
          
          {/* Manager */}
          <button 
            onClick={() => handleSidebarNavigation('/super-admin')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <Shield className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Manager</span>
          </button>
          
          {/* Reports */}
          <button 
            onClick={() => handleSidebarNavigation('/reports')}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <Activity className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Reports</span>
          </button>
          
          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center p-2 rounded-lg w-16 h-16 mt-auto hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer"
          >
            <LogOut className="h-7 w-7 text-white mb-1" />
            <span className="text-xs text-white text-center" style={{ fontFamily: 'Jura', fontSize: '12.72px' }}>Logout</span>
          </button>
          
          {/* DVK Logo */}
          <div className="mt-4">
            <img 
              src="/dvk-simple.svg" 
              alt="DVK" 
              style={{ width: '68px', height: '57px' }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-23" style={{ marginLeft: '102px', padding: '65px 102px 0 0' }}>
        {/* Header */}
        <div className="relative mb-8" style={{ marginBottom: '32px' }}>
          <div className="flex justify-between items-start">
            <div style={{ marginLeft: '100px' }}>
              <h1 className="text-3xl font-bold text-black mb-2" style={{ 
                fontFamily: 'Jura', 
                fontSize: '32px', 
                lineHeight: '38px',
                fontWeight: 700,
                marginBottom: '8px'
              }}>Message Campaigns</h1>
              <p className="text-lg text-black" style={{ 
                fontFamily: 'Jura', 
                fontSize: '18.36px',
                lineHeight: '22px',
                fontWeight: 500,
                letterSpacing: '0.08em'
              }}>
                Manage and track your messaging campaigns
              </p>
            </div>
            
            {/* Glenmark Logo */}
            <div className="absolute top-0 right-0" style={{ right: '102px' }}>
              <img 
                src="/glenmark-simple.svg" 
                alt="Glenmark" 
                style={{ width: '140px', height: '79px' }}
              />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6" style={{ marginTop: '24px', marginLeft: '100px' }}>
            <button
              onClick={exportCampaignsToCSV}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ 
                background: '#1E1E1E', 
                fontFamily: 'Jura',
                fontSize: '13.51px',
                lineHeight: '16px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                padding: '10px 16px',
                borderRadius: '10px'
              }}
            >
              Export
            </button>
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
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ 
                background: '#2C2696', 
                fontFamily: 'Jura',
                fontSize: '13.51px',
                lineHeight: '16px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                padding: '10px 16px',
                borderRadius: '10px'
              }}
            >
              New Campaign
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative" style={{ width: '1308px', height: '935px', marginLeft: '100px' }}>
          {/* Background with blur effect */}
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(120.66deg, rgba(255, 255, 255, 0.4) 7.56%, rgba(255, 255, 255, 0.1) 93.23%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '15px',
              width: '1308px',
              height: '935px'
            }}
          />
          
          {/* Content */}
          <div className="relative" style={{ padding: '24px' }}>
            {/* Statistics Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8" style={{ gap: '24px', marginBottom: '32px' }}>
              {/* Total Campaigns */}
              <div className="bg-white rounded-lg p-6" style={{ 
                background: 'rgba(44, 38, 150, 0.1)', 
                borderRadius: '10px',
                width: '255px',
                height: '161px',
                padding: '24px',
                border: '1px solid #000000'
              }}>
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-6xl font-bold text-black mb-2" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '64px',
                    lineHeight: '76px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>{campaigns.length}</p>
                  <h3 className="text-lg font-bold text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18px',
                    lineHeight: '21px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>Total Campaigns</h3>
                </div>
              </div>

              {/* Completed Campaigns */}
              <div className="bg-white rounded-lg p-6" style={{ 
                background: 'rgba(44, 38, 150, 0.15)', 
                borderRadius: '10px',
                width: '255px',
                height: '161px',
                padding: '24px',
                border: '1px solid #000000'
              }}>
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-6xl font-bold text-black mb-2" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '64px',
                    lineHeight: '76px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>{campaigns.filter(c => c.status === 'completed').length}</p>
                  <h3 className="text-lg font-bold text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18px',
                    lineHeight: '21px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>Completed Campaigns</h3>
                </div>
              </div>

              {/* Campaigns InProgress */}
              <div className="bg-white rounded-lg p-6" style={{ 
                background: 'rgba(44, 38, 150, 0.2)', 
                borderRadius: '10px',
                width: '255px',
                height: '161px',
                padding: '24px',
                border: '1px solid #000000'
              }}>
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-6xl font-bold text-black mb-2" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '64px',
                    lineHeight: '76px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>{campaigns.filter(c => c.status === 'sending').length}</p>
                  <h3 className="text-lg font-bold text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18px',
                    lineHeight: '21px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>Campaigns InProgress</h3>
                </div>
              </div>

              {/* Failed Campaigns */}
              <div className="bg-white rounded-lg p-6" style={{ 
                background: 'rgba(44, 38, 150, 0.25)', 
                borderRadius: '10px',
                width: '255px',
                height: '161px',
                padding: '24px',
                border: '1px solid #000000'
              }}>
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-6xl font-bold text-black mb-2" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '64px',
                    lineHeight: '76px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>{campaigns.filter(c => c.status === 'failed').length}</p>
                  <h3 className="text-lg font-bold text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18px',
                    lineHeight: '21px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>Failed Campaigns</h3>
                </div>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="flex items-center justify-between mb-6" style={{ marginBottom: '24px' }}>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border-0"
                  style={{ 
                    background: '#F2F2F2',
                    borderRadius: '10px',
                    height: '44px',
                    padding: '12px 16px',
                    width: '825px'
                  }}
                />
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ 
                    background: '#1E1E1E', 
                    fontFamily: 'Jura',
                    fontSize: '13.51px',
                    lineHeight: '16px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    height: '36px'
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="sending">Sending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
                <span className="text-sm text-black font-bold" style={{ 
                  fontFamily: 'Jura',
                  fontSize: '13.51px',
                  lineHeight: '16px',
                  fontWeight: 600,
                  letterSpacing: '0.08em'
                }}>
                  {filteredCampaigns.length} Campaigns
                </span>
              </div>
            </div>

            {/* Empty State or Campaigns List */}
            {filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2" style={{ 
                  fontFamily: 'Jura',
                  fontSize: '18.36px',
                  lineHeight: '22px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'rgba(0, 0, 0, 0.5)'
                }}>
                  No Campaigns were Found
                </h3>
                <p className="text-sm text-black mb-4" style={{ 
                  fontFamily: 'Jura',
                  fontSize: '10px',
                  lineHeight: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'rgba(0, 0, 0, 0.5)'
                }}>
                  Add your first Campaign to get started...
                </p>
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
                  className="px-6 py-3 rounded-lg text-white text-sm font-semibold"
                  style={{ 
                    background: '#2C2696', 
                    fontFamily: 'Jura',
                    fontSize: '13.51px',
                    lineHeight: '16px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    padding: '10px 16px',
                    borderRadius: '10px'
                  }}
                >
                  Create First Campaign
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampaigns.map(campaign => (
                  <div key={campaign.id} className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-black" style={{ fontFamily: 'Jura' }}>
                            {campaign.content.slice(0, 50)}{campaign.content.length > 50 ? '...' : ''}
                          </h3>
                          {campaign.imageUrl && (
                            <div title="Has Image">
                              <Image className="h-4 w-4 text-blue-500" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'Jura' }}>
                              {campaign.totalRecipients} recipients
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600" style={{ fontFamily: 'Jura' }}>
                              {new Date(campaign.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {campaign.scheduledAt && (
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600" style={{ fontFamily: 'Jura' }}>
                                Scheduled: {new Date(campaign.scheduledAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(campaign)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Target Groups */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Jura' }}>Target Groups:</p>
                      <div className="flex flex-wrap gap-2">
                        {campaign.targetGroups.map(group => (
                          <span
                            key={group}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Campaign Image */}
                    {campaign.imageUrl && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Jura' }}>Image:</p>
                        <img
                          src={campaign.imageUrl}
                          alt="Campaign"
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}

                    {/* Status and Progress */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                          <span className="ml-1">{campaign.status}</span>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${campaign.totalRecipients > 0 ? (campaign.sentCount / campaign.totalRecipients) * 100 : 0}%`
                          }}
                        />
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Sent: {campaign.sentCount}</span>
                        <span>Failed: {campaign.failedCount}</span>
                        <span>Total: {campaign.totalRecipients}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold text-black mb-4" style={{ fontFamily: 'Jura' }}>
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
                  Message Content *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter your message content..."
                />
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-sm ${formData.content.length > 900 ? 'text-red-600' : 'text-gray-500'}`} style={{ fontFamily: 'Jura' }}>
                    {formData.content.length}/1000 characters
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700" style={{ fontFamily: 'Jura' }}>{group.groupName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
                    Image Upload
                  </label>
                  <div className="space-y-3">
                    {/* Image Upload Input */}
                    <div className="space-y-2">
                      {/* Drag & Drop Zone */}
                      <div 
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          imageFile ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                          const files = e.dataTransfer.files;
                          if (files.length > 0) {
                            const file = files[0];
                            if (file.type.startsWith('image/')) {
                              setImageFile(file);
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setImagePreview(e.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      >
                        <div className="space-y-2">
                          <Image className="h-8 w-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'Jura' }}>
                            {imageFile ? 'Image selected: ' + imageFile.name : 'Drag & drop an image here, or click to browse'}
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-upload"
                          />
                          <label 
                            htmlFor="image-upload"
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                          >
                            Browse Files
                          </label>
                        </div>
                      </div>
                      
                      {/* Upload Button */}
                      {imageFile && (
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleImageUpload(imageFile)}
                            disabled={uploadingImage}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {uploadingImage ? 'Uploading...' : 'Upload Image'}
                          </button>
                        </div>
                      )}
                      
                      {/* Success Message */}
                      {uploadSuccess && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-800 font-medium" style={{ fontFamily: 'Jura' }}>
                              Image uploaded successfully! 🎉
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {/* Current Image URL (for editing) */}
                    {formData.imageUrl && !imagePreview && (
                      <div className="relative">
                        <img
                          src={formData.imageUrl}
                          alt="Current"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
                    Schedule For
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ 
                    background: '#2C2696', 
                    fontFamily: 'Jura'
                  }}
                >
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
                <button
                  type="button"
                  onClick={() => {
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
                  }}
                  className="px-4 py-2 rounded-lg text-gray-700 text-sm font-semibold border border-gray-300"
                  style={{ fontFamily: 'Jura' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
