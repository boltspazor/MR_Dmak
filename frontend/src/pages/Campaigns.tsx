import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Trash2, 
  Search, 
  Send,
  Upload,
  X,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { api } from '../lib/api';
import { Campaign, Group, Template } from '../types';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import { useAuth } from '../contexts/AuthContext';

const CampaignsNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'with-template' | 'without-template'>('with-template');
  
  // Sorting states
  const [sortField, setSortField] = useState<keyof Campaign>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // With Template Tab States
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [selectedGroupDropdown, setSelectedGroupDropdown] = useState<string>('');
  const [selectedTemplateDropdown, setSelectedTemplateDropdown] = useState<string>('');
  
  // Preview states
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewGroup, setPreviewGroup] = useState<Group | null>(null);
  const [showGroupPreview, setShowGroupPreview] = useState(false);

  // Without Template Tab States
  const [messageContent, setMessageContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchCampaigns();
    fetchGroups();
    fetchTemplates();
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

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get('/templates');
      setTemplates(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleGroupSelection = (groupName: string) => {
    if (selectedGroups.includes(groupName)) {
      setSelectedGroups(selectedGroups.filter(g => g !== groupName));
    } else {
      setSelectedGroups([...selectedGroups, groupName]);
    }
  };

  const handleGroupDropdownChange = (groupName: string) => {
    setSelectedGroupDropdown(groupName);
    if (groupName && !selectedGroups.includes(groupName)) {
      setSelectedGroups([...selectedGroups, groupName]);
    }
  };

  const handleTemplateDropdownChange = (templateId: string) => {
    setSelectedTemplateDropdown(templateId);
    const template = templates.find(t => t._id === templateId);
    setSelectedTemplate(template || null);
  };

  const handleTemplatePreview = (template: Template) => {
    setPreviewTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleGroupPreview = (group: Group) => {
    setPreviewGroup(group);
    setShowGroupPreview(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleWithTemplateSubmit = async () => {
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    if (selectedGroups.length === 0) {
      alert('Please select at least one group');
      return;
    }

    try {
      const campaignData = {
        content: selectedTemplate.content,
        imageUrl: selectedTemplate.imageUrl || '',
        targetGroups: selectedGroups,
        templateId: selectedTemplate._id
      };

      await api.post('/messages/campaigns', campaignData);
      await fetchCampaigns();
      
      // Reset form
      setSelectedGroups([]);
      setSelectedTemplate(null);
      
      alert('Campaign created successfully!');
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  const handleWithoutTemplateSubmit = async () => {
    if (!messageContent.trim() && !selectedImage) {
      alert('Please enter a message or select an image');
        return;
      }
      
    if (selectedGroups.length === 0) {
      alert('Please select at least one group');
        return;
      }

    try {
      let imageUrl = '';
      
      // Upload image if selected
      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('type', 'campaign');
        
        const uploadResponse = await api.post('/messages/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadResponse.data.imageUrl;
      }

      const campaignData = {
        content: messageContent,
        imageUrl: imageUrl,
        targetGroups: selectedGroups
      };

      await api.post('/messages/campaigns', campaignData);
      await fetchCampaigns();
      
      // Reset form
      setMessageContent('');
      setSelectedImage(null);
    setImagePreview('');
      setSelectedGroups([]);
      
      alert('Campaign created successfully!');
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;

    try {
      await api.delete(`/messages/campaigns/${id}`);
      await fetchCampaigns();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
    }
  };

  const handleSort = (field: keyof Campaign) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredCampaigns = campaigns
    .filter(campaign => {
    const matchesSearch = 
      campaign.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.campaignId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.targetGroups.some(group => group.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !selectedStatus || campaign.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle special cases for sorting
      if (sortField === 'targetGroups') {
        aValue = a.targetGroups.join(', ');
        bValue = b.targetGroups.join(', ');
      } else if (sortField === 'createdAt') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Calculate success rate
  const getSuccessRate = () => {
    if (campaigns.length === 0) return 0;
    const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.sentCount, 0);
    const totalRecipients = campaigns.reduce((sum, campaign) => sum + campaign.totalRecipients, 0);
    return totalRecipients > 0 ? Math.round((totalSent / totalRecipients) * 100) : 0;
  };

  const summaryItems = [
    {
      title: 'Total Campaigns',
      value: campaigns.length,
      icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'Success Rate',
      value: `${getSuccessRate()}%`,
      icon: <BarChart3 className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100'
    }
  ];

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
      <div className="min-h-screen bg-gray-100">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
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
          title="D-MAK"
          subtitle="Digital - Marketing, Automate & Konnect"
          onExportCSV={() => {}}
          onExportPDF={() => {}}
          showExportButtons={false}
        />

        {/* Separator Line */}
        <div className="border-b-2 border-indigo-500 my-6"></div>

        {/* Main Content Area */}
        <CommonFeatures
          summaryItems={summaryItems}
          onExportCSV={() => {}}
          onExportPDF={() => {}}
        >
          <div className="space-y-8">
            {/* Campaign Management Header */}
            <h2 className="text-2xl font-bold text-gray-900">Campaign Management</h2>

            {/* Tabs */}
            <div className="flex space-x-8 mt-6">
              {[
                { key: 'with-template', label: 'With Template' },
                { key: 'without-template', label: 'Without Template' }
              ].map((tab) => (
          <button 
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`pb-2 border-b-2 text-lg font-medium capitalize ${
                    activeTab === tab.key 
                      ? 'border-indigo-600 text-gray-900' 
                      : 'border-transparent text-gray-600'
                  }`}
                >
                  {tab.label}
          </button>
              ))}
        </div>

            {/* With Template Tab */}
            {activeTab === 'with-template' && (
              <div className="space-y-6">
                {/* Group Selection Dropdown */}
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Groups</h3>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <select
                          value={selectedGroupDropdown}
                          onChange={(e) => handleGroupDropdownChange(e.target.value)}
                          className="w-full px-3 py-2 pr-10 rounded-lg border-0 bg-gray-100 appearance-none cursor-pointer"
                        >
                          <option value="">Select a group to add</option>
                          {groups.map(group => (
                            <option key={group.id} value={group.groupName}>
                              {group.groupName} ({group.mrCount || 0} contacts)
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
          <button 
                        onClick={() => {
                          const group = groups.find(g => g.groupName === selectedGroupDropdown);
                          if (group) handleGroupPreview(group);
                        }}
                        disabled={!selectedGroupDropdown}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
          </button>
                    </div>
                    
                    {/* Selected Groups Display */}
                    {selectedGroups.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Selected Groups:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedGroups.map(groupName => (
                            <div
                              key={groupName}
                              className="flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{groupName}</span>
          <button 
                                onClick={() => handleGroupSelection(groupName)}
                                className="text-indigo-600 hover:text-indigo-800"
          >
                                <X className="h-3 w-3" />
          </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Template Selection Dropdown */}
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Template</h3>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <select
                          value={selectedTemplateDropdown}
                          onChange={(e) => handleTemplateDropdownChange(e.target.value)}
                          className="w-full px-3 py-2 pr-10 rounded-lg border-0 bg-gray-100 appearance-none cursor-pointer"
                        >
                          <option value="">Select a template</option>
                          {templates.map(template => (
                            <option key={template._id} value={template._id}>
                              {template.name} ({template.type})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
          <button 
                        onClick={() => {
                          const template = templates.find(t => t._id === selectedTemplateDropdown);
                          if (template) handleTemplatePreview(template);
                        }}
                        disabled={!selectedTemplateDropdown}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
          </button>
          </div>
          
                    {/* Selected Template Preview */}
                    {selectedTemplate && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{selectedTemplate.name}</h4>
          <button 
                            onClick={() => setShowTemplatePreview(true)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm"
          >
                            Full Preview
          </button>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3">{selectedTemplate.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">{selectedTemplate.type}</span>
                          <span className="text-xs text-gray-500">
                            {selectedTemplate.parameters.length} parameters
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
          <button 
                    onClick={handleWithTemplateSubmit}
                    disabled={!selectedTemplate || selectedGroups.length === 0}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
                    <Send className="h-5 w-5 mr-2" />
                    Send Message
          </button>
                </div>
                    </div>
            )}

            {/* Without Template Tab */}
            {activeTab === 'without-template' && (
              <div className="space-y-6">
                {/* Group Selection Dropdown */}
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Groups</h3>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <select
                          value={selectedGroupDropdown}
                          onChange={(e) => handleGroupDropdownChange(e.target.value)}
                          className="w-full px-3 py-2 pr-10 rounded-lg border-0 bg-gray-100 appearance-none cursor-pointer"
                        >
                          <option value="">Select a group to add</option>
                          {groups.map(group => (
                            <option key={group.id} value={group.groupName}>
                              {group.groupName} ({group.mrCount || 0} contacts)
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
          <button 
                        onClick={() => {
                          const group = groups.find(g => g.groupName === selectedGroupDropdown);
                          if (group) handleGroupPreview(group);
                        }}
                        disabled={!selectedGroupDropdown}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
          </button>
                    </div>
                    
                    {/* Selected Groups Display */}
                    {selectedGroups.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Selected Groups:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedGroups.map(groupName => (
                            <div
                              key={groupName}
                              className="flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{groupName}</span>
          <button 
                                onClick={() => handleGroupSelection(groupName)}
                                className="text-indigo-600 hover:text-indigo-800"
          >
                                <X className="h-3 w-3" />
          </button>
          </div>
                          ))}
        </div>
      </div>
                    )}
                  </div>
            </div>
            
                {/* Message Composition */}
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Compose Message</h3>
                  
                  <div className="space-y-4">
                    {/* Message Input */}
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Type your message here..."
                  rows={4}
                        className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100 resize-none"
                />
          </div>
          
                    {/* Image Upload */}
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Image (Optional)</label>
                    <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                          onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <label 
                            htmlFor="image-upload"
                          className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors"
                          >
                          <Upload className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">Click to upload image</span>
                          </label>
                        
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                              className="w-full h-32 object-cover rounded-lg"
                        />
            <button
                          onClick={removeImage}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                              <X className="h-4 w-4" />
            </button>
          </div>
                    )}
        </div>
                </div>
                </div>
              </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleWithoutTemplateSubmit}
                    disabled={(!messageContent.trim() && !selectedImage) || selectedGroups.length === 0}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send Message
                  </button>
                </div>
              </div>
                    )}

            {/* Campaigns List */}
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
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('campaignId')}
                      >
                        <div className="flex items-center justify-center">
                          Campaign ID
                          {sortField === 'campaignId' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </span>
                          )}
              </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('content')}
                      >
                        <div className="flex items-center justify-center">
                          Content
                          {sortField === 'content' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('targetGroups')}
                      >
                        <div className="flex items-center justify-center">
                          Target Groups
                          {sortField === 'targetGroups' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </span>
                          )}
                          </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center">
                          Status
                          {sortField === 'status' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </span>
                          )}
                          </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('sentCount')}
                      >
                        <div className="flex items-center justify-center">
                          Progress
                          {sortField === 'sentCount' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </span>
                          )}
                            </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center justify-center">
                          Created
                          {sortField === 'createdAt' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.length > 0 ? (
                      filteredCampaigns.map((campaign, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-6 text-sm text-gray-900 text-center font-mono">{campaign.campaignId}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center max-w-xs truncate">{campaign.content}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{campaign.targetGroups.join(', ')}</td>
                          <td className="py-3 px-6 text-sm text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                              campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                              campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            {campaign.totalRecipients > 0 ? (
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-indigo-600 h-2 rounded-full" 
                                    style={{ width: `${(campaign.sentCount / campaign.totalRecipients) * 100}%` }}
                                  ></div>
                      </div>
                                <span className="text-xs text-gray-600">
                                  {campaign.sentCount}/{campaign.totalRecipients}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">No recipients</span>
                            )}
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-6 text-sm text-center">
                            <div className="flex items-center justify-center space-x-2">
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
                              Create your first campaign using the tabs above
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

        {/* Template Preview Modal */}
        {showTemplatePreview && previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Template Preview: {previewTemplate.name}
                </h2>
                <button
                  onClick={() => setShowTemplatePreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
                    </div>

              <div className="space-y-6">
                {/* Template Preview */}
                <div className="border-2 border-gray-200 rounded-lg p-6 bg-white">
                  <div className="space-y-4">
                    {/* Header Image */}
                    {previewTemplate.imageUrl && (
                      <div className="text-center">
                        <img 
                          src={previewTemplate.imageUrl} 
                          alt="Header"
                          className="max-w-full h-48 object-contain mx-auto rounded"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800">
                        {previewTemplate.content}
                      </pre>
                      </div>

                    {/* Footer Image */}
                    {previewTemplate.footerImageUrl && (
                      <div className="text-center">
                        <img 
                          src={previewTemplate.footerImageUrl} 
                          alt="Footer"
                          className="max-w-full h-32 object-contain mx-auto rounded"
                        />
              </div>
            )}
        </div>
      </div>

                {/* Template Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Template Type:
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {previewTemplate.type}
                  </span>
              </div>

              <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Created:
                    </h4>
                    <span className="text-sm text-gray-600">
                      {new Date(previewTemplate.createdAt).toLocaleDateString()}
                    </span>
                </div>
              </div>

                {/* Parameters */}
                {previewTemplate.parameters.length > 0 && (
                <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Parameters:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {previewTemplate.parameters.map((param, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          #{param}
                        </span>
                      ))}
                        </div>
                        </div>
                      )}
                          </div>
                        </div>
                    </div>
        )}

        {/* Group Preview Modal */}
        {showGroupPreview && previewGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Group Preview: {previewGroup.groupName}
                </h2>
                        <button
                  onClick={() => setShowGroupPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                        >
                  <X className="h-6 w-6" />
                        </button>
                      </div>
              
              <div className="space-y-6">
                {/* Group Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Group Name:
                      </h4>
                      <span className="text-sm text-gray-600">{previewGroup.groupName}</span>
                      </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Contact Count:
                      </h4>
                      <span className="text-sm text-gray-600">{previewGroup.mrCount || 0} contacts</span>
                  </div>
                </div>
                </div>
                
                {/* Group Description */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Description:
                  </h4>
                  <p className="text-sm text-gray-600">
                    This group contains {previewGroup.mrCount || 0} medical representatives who will receive the campaign messages.
                  </p>
              </div>

                {/* Group Statistics */}
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Group Statistics:
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Contacts:</span>
                      <span className="ml-2 font-medium">{previewGroup.mrCount || 0}</span>
              </div>
                    <div>
                      <span className="text-gray-600">Group Status:</span>
                      <span className="ml-2 font-medium text-green-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CampaignsNew;