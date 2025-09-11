import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Send,
  Upload,
  X,
  BarChart3,
  ChevronDown,
  Eye
} from 'lucide-react';
import { api } from '../lib/api';
import { Campaign, Group, Template, RecipientList } from '../types';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import { useAuth } from '../contexts/AuthContext';

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'with-template' | 'custom-messages'>('with-template');
  
  // With Template Tab States
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [selectedGroupDropdown, setSelectedGroupDropdown] = useState<string>('');
  const [selectedTemplateDropdown, setSelectedTemplateDropdown] = useState<string>('');
  const [campaignName, setCampaignName] = useState('');
  const [selectedRecipientList, setSelectedRecipientList] = useState<RecipientList | null>(null);
  
  // Preview states
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewGroup] = useState<Group | null>(null);
  const [showGroupPreview, setShowGroupPreview] = useState(false);

  // Without Template Tab States
  const [messageContent, setMessageContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Recipient List Modal States
  const [showCreateRecipientList, setShowCreateRecipientList] = useState(false);
  const [recipientListName, setRecipientListName] = useState('');
  const [recipientListDescription, setRecipientListDescription] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [campaignsRes, groupsRes, templatesRes] = await Promise.all([
        api.get('/messages/campaigns'),
        api.get('/groups'),
        api.get('/templates')
      ]);
      
      setCampaigns(campaignsRes.data);
      setGroups(groupsRes.data);
      setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelection = (groupName: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  const handleGroupDropdownChange = (groupName: string) => {
    if (groupName && !selectedGroups.includes(groupName)) {
      setSelectedGroups(prev => [...prev, groupName]);
    }
    setSelectedGroupDropdown('');
  };

  const handleTemplateDropdownChange = (templateId: string) => {
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setSelectedTemplate(template);
    }
    setSelectedTemplateDropdown('');
  };

  const handleTemplatePreview = (template: Template) => {
    setPreviewTemplate(template);
    setShowTemplatePreview(true);
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

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const data = lines.map(line => line.split(','));
        setCsvData(data);
        setShowCsvPreview(true);
      };
      reader.readAsText(file);
    }
  };

  const handleCreateRecipientList = async () => {
    if (!recipientListName.trim() || !csvFile) {
      alert('Please provide a name and upload a CSV file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', recipientListName);
      formData.append('description', recipientListDescription);
      formData.append('csvFile', csvFile);

      await api.post('/recipient-lists/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Recipient list created successfully!');
      setShowCreateRecipientList(false);
      setRecipientListName('');
      setRecipientListDescription('');
      setCsvFile(null);
      setCsvData([]);
      setShowCsvPreview(false);
    } catch (error) {
      console.error('Error creating recipient list:', error);
      alert('Failed to create recipient list');
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleWithTemplateSubmit = async () => {
    if (!selectedTemplate || !selectedRecipientList || !campaignName.trim()) {
      alert('Please select a template, recipient list, and enter a campaign name');
      return;
    }

    try {
      const campaignData = {
        name: campaignName,
        templateId: selectedTemplate._id,
        recipientListId: selectedRecipientList._id,
        type: 'with-template'
      };

      await api.post('/messages/campaigns', campaignData);
      alert('Campaign created and messages sent successfully!');
      
      // Reset form
      setSelectedTemplate(null);
      setSelectedRecipientList(null);
      setCampaignName('');
      setSelectedTemplateDropdown('');
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  const handleWithoutTemplateSubmit = async () => {
    if (!messageContent.trim() || selectedGroups.length === 0 || !campaignName.trim()) {
      alert('Please enter message content, select groups, and enter a campaign name');
      return;
    }

    try {
      const campaignData = {
        name: campaignName,
        content: messageContent,
        targetGroups: selectedGroups,
        image: selectedImage,
        type: 'custom-messages'
      };

      const formData = new FormData();
      formData.append('name', campaignData.name);
      formData.append('content', campaignData.content);
      formData.append('targetGroups', JSON.stringify(campaignData.targetGroups));
      formData.append('type', campaignData.type);
      if (campaignData.image) {
        formData.append('image', campaignData.image);
      }

      await api.post('/messages/campaigns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Campaign created and messages sent successfully!');
      
      // Reset form
      setMessageContent('');
      setSelectedGroups([]);
      setCampaignName('');
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  const summaryItems = [
    {
      title: 'Total Campaigns',
      value: campaigns.length.toString(),
      icon: <MessageSquare className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Success Rate',
      value: campaigns.length > 0 
        ? `${Math.round((campaigns.filter(c => c.status === 'completed').length / campaigns.length) * 100)}%`
        : '0%',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'bg-green-500'
    }
  ];

  const handleSidebarNavigation = (page: string) => {
    navigate(`/${page}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaigns...</p>
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

        {/* Campaign Management Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Campaign Management</h2>

        {/* Main Content Area */}
        <CommonFeatures
          summaryItems={summaryItems}
          onExportCSV={() => {}}
          onExportPDF={() => {}}
        >
          <div className="space-y-8">

            {/* Tabs */}
            <div className="flex space-x-8 mt-6">
              {[
                { key: 'with-template', label: 'With Template' },
                { key: 'custom-messages', label: 'Custom Messages' }
              ].map((tab) => (
                <button 
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`pb-2 border-b-2 text-lg font-medium capitalize ${
                    activeTab === tab.key 
                      ? 'border-indigo-600 text-gray-900' 
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* With Template Tab */}
            {activeTab === 'with-template' && (
              <div className="space-y-6">
                {/* Campaign Name */}
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Name</h3>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
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

                    {/* Selected Template Display */}
                    {selectedTemplate && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Selected Template:</p>
                        <div className="flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                          <span>{selectedTemplate.name}</span>
                          <button
                            onClick={() => {
                              setSelectedTemplate(null);
                              setSelectedTemplateDropdown('');
                            }}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Recipient List Button */}
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipient List</h3>
                  <button
                    onClick={() => setShowCreateRecipientList(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                  >
                    Add Recipient List
                  </button>

                  {/* Selected Recipient List Display */}
                  {selectedRecipientList && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected Recipient List:</p>
                      <div className="flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                        <span>{selectedRecipientList.name} ({selectedRecipientList.data.length} records)</span>
                        <button
                          onClick={() => setSelectedRecipientList(null)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Konnect Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleWithTemplateSubmit}
                    disabled={!selectedTemplate || !selectedRecipientList || !campaignName.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Konnect
                  </button>
                </div>
              </div>
            )}

            {/* Custom Messages Tab */}
            {activeTab === 'custom-messages' && (
              <div className="space-y-6">
                {/* Campaign Name */}
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Name</h3>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

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
                          <option value="">All Groups</option>
                          {groups.map(group => (
                            <option key={group.id} value={group.groupName}>
                              {group.groupName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
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

                  <div className="space-y-6">
                    {/* Message Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text *</label>
                      <textarea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Enter message content with parameters like #FN, #LN, #Month, #Target..."
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use #ParameterName for dynamic parameters (e.g., #FN, #LN, #Month, #Target)
                      </p>
                    </div>

                    {/* Header Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Header Image (Optional)
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="header-image-upload"
                        />
                        <label
                          htmlFor="header-image-upload"
                          className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors"
                        >
                          <Upload className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">Click to upload header image</span>
                        </label>

                        {imagePreview && (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Header preview"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
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

                {/* Konnect Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleWithoutTemplateSubmit}
                    disabled={!messageContent.trim() || selectedGroups.length === 0 || !campaignName.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Konnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </CommonFeatures>

        {/* Create Recipient List Modal */}
        {showCreateRecipientList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Create Recipient List</h2>
                <button
                  onClick={() => {
                    setShowCreateRecipientList(false);
                    setRecipientListName('');
                    setRecipientListDescription('');
                    setCsvFile(null);
                    setCsvData([]);
                    setShowCsvPreview(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Recipient List Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    List Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientListName}
                    onChange={(e) => setRecipientListName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter recipient list name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={recipientListDescription}
                    onChange={(e) => setRecipientListDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter description (optional)"
                  />
                </div>

                {/* CSV Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CSV File *
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors"
                    >
                      <Upload className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Click to upload CSV file</span>
                    </label>

                    {csvFile && (
                      <p className="text-sm text-green-600">
                        File selected: {csvFile.name}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV should have columns like: MR id, First Name, Last Name, #FN, #LN, #Month, #week, #Target, #lastmonth, #doctor
                  </p>
                </div>

                {/* CSV Preview */}
                {showCsvPreview && csvData.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">CSV Preview (first 5 rows):</h4>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {csvData[0]?.map((header: string, index: number) => (
                              <th key={index} className="px-3 py-2 text-left font-medium text-gray-700">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(1, 6).map((row: string[], rowIndex: number) => (
                            <tr key={rowIndex} className="border-t">
                              {row.map((cell: string, cellIndex: number) => (
                                <td key={cellIndex} className="px-3 py-2 text-gray-600">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateRecipientList(false);
                      setRecipientListName('');
                      setRecipientListDescription('');
                      setCsvFile(null);
                      setCsvData([]);
                      setShowCsvPreview(false);
                    }}
                    className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRecipientList}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Create Recipient List
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                      {previewTemplate.parameters.map((param: string, index: number) => (
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
                  <h4 className="font-medium text-gray-900 mb-2">
                    Group Information:
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Group Name:</span>
                      <span className="ml-2 font-medium">{previewGroup.groupName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Contacts:</span>
                      <span className="ml-2 font-medium">{previewGroup.mrCount || 0}</span>
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

export default Campaigns;