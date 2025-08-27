import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Download,
  Send,
  Users,
  Calendar,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { api } from '../lib/api';
import { Campaign, Group } from '../types';

const Campaigns: React.FC = () => {
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

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
            <h1 className="text-3xl font-bold text-gray-900">Message Campaigns</h1>
            <p className="text-gray-600">Manage and track your messaging campaigns</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={exportCampaignsToCSV}
              variant="outline"
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
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
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
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
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {campaigns.filter(c => c.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {campaigns.filter(c => c.status === 'sending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <XCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {campaigns.filter(c => c.status === 'failed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h2>
            </CardHeader>
            <CardContent>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{group.groupName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                            <p className="text-sm text-gray-600">
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
                            <Button
                              type="button"
                              onClick={() => handleImageUpload(imageFile)}
                              disabled={uploadingImage}
                              size="sm"
                              className="flex-shrink-0"
                            >
                              {uploadingImage ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Uploading...
                                </>
                              ) : (
                                'Upload Image'
                              )}
                            </Button>
                          </div>
                        )}
                        
                        {/* Success Message */}
                        {uploadSuccess && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-800 font-medium">
                                Image uploaded successfully! 🎉
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* File Info */}
                        {imageFile && (
                          <div className="text-xs text-gray-500">
                            <p>File: {imageFile.name}</p>
                            <p>Size: {(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p>Type: {imageFile.type}</p>
                          </div>
                        )}
                        
                        {/* Help Text */}
                        <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                          <p>📱 Supported formats: JPEG, PNG, GIF, WebP</p>
                          <p>📏 Maximum size: 10MB</p>
                          <p>💡 Images will be sent with your message via WhatsApp</p>
                        </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <Button type="submit">
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
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
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="sending">Sending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <span className="text-sm text-gray-500">{filteredCampaigns.length} campaigns</span>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map(campaign => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
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
                        <span className="text-sm text-gray-600">
                          {campaign.totalRecipients} recipients
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {campaign.scheduledAt && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
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
                  <p className="text-sm font-medium text-gray-700 mb-2">Target Groups:</p>
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
                    <p className="text-sm font-medium text-gray-700 mb-2">Image:</p>
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
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No campaigns found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || selectedStatus ? 'Try adjusting your search terms or filters' : 'Create your first campaign to get started'}
            </p>
            {!searchTerm && !selectedStatus && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Campaign
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Campaigns;
