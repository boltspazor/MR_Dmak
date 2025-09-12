import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Send,
  Upload,
  X,
  ChevronDown,
  Eye,
  CheckCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { Campaign, Template, RecipientList } from '../types';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import { useAuth } from '../contexts/AuthContext';

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'with-template' | 'custom-messages'>('with-template');
  
  // With Template Tab States
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [selectedTemplateDropdown, setSelectedTemplateDropdown] = useState<string>('');
  const [campaignName, setCampaignName] = useState('');
  const [selectedRecipientList, setSelectedRecipientList] = useState<RecipientList | null>(null);
  
  // Preview states
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewGroup] = useState<any>(null);
  const [showGroupPreview, setShowGroupPreview] = useState(false);

  // Without Template Tab States
  const [messageContent, setMessageContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [footerImage, setFooterImage] = useState<File | null>(null);
  const [footerImagePreview, setFooterImagePreview] = useState<string | null>(null);

  // MR Search and Selection States
  const [mrs, setMrs] = useState<any[]>([]);
  const [mrSearchTerm, setMrSearchTerm] = useState('');
  const [selectedMrs, setSelectedMrs] = useState<string[]>([]);
  const [showMrSelection, setShowMrSelection] = useState(false);

  // Recipient List Modal States
  const [showCreateRecipientList, setShowCreateRecipientList] = useState(false);
  const [recipientListName, setRecipientListName] = useState('');
  const [recipientListDescription, setRecipientListDescription] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);

  // Error Popup States
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');

  // Send Confirmation Popup States
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [campaignsRes, templatesRes, mrsRes] = await Promise.all([
        api.get('/messages/campaigns'),
        api.get('/templates'),
        api.get('/mrs')
      ]);
      
      // Handle different response structures safely
      setCampaigns(campaignsRes.data?.data || campaignsRes.data || []);
      setTemplates(templatesRes.data?.data || templatesRes.data || []);
      setMrs(mrsRes.data?.data || mrsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error to prevent undefined access
      setCampaigns([]);
      setTemplates([]);
      setMrs([]);
    } finally {
      setLoading(false);
    }
  };


  const handleMrSelection = (mrId: string) => {
    setSelectedMrs(prev => 
      prev.includes(mrId) 
        ? prev.filter(id => id !== mrId)
        : [...prev, mrId]
    );
  };

  const filteredMrs = mrs.filter(mr => 
    mr.firstName?.toLowerCase().includes(mrSearchTerm.toLowerCase()) ||
    mr.lastName?.toLowerCase().includes(mrSearchTerm.toLowerCase()) ||
    mr.mrId?.toLowerCase().includes(mrSearchTerm.toLowerCase()) ||
    mr.phone?.includes(mrSearchTerm)
  );


  const handleTemplateDropdownChange = (templateId: string) => {
    if (!templateId) return;
    const template = (templates || []).find(t => t?._id === templateId);
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


  const handleCreateRecipientList = async () => {
    if (!recipientListName.trim() || !csvFile) {
      showError('Missing Information', 'Please provide a name and upload a CSV file');
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

      showError('Success', 'Recipient list created successfully!', true);
      setShowCreateRecipientList(false);
      setRecipientListName('');
      setRecipientListDescription('');
      setCsvFile(null);
      setCsvData([]);
      setShowCsvPreview(false);
    } catch (error) {
      console.error('Error creating recipient list:', error);
      showError('Error', 'Failed to create recipient list');
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleWithTemplateSubmit = async () => {
    if (!selectedTemplate || !selectedRecipientList || !campaignName.trim()) {
      showError('Missing Information', 'Please select a template, recipient list, and enter a campaign name');
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
      setShowSendConfirmation(true);
      
      // Reset form
      setSelectedTemplate(null);
      setSelectedRecipientList(null);
      setCampaignName('');
      setSelectedTemplateDropdown('');
    } catch (error) {
      console.error('Error creating campaign:', error);
      showError('Error', 'Failed to create campaign');
    }
  };

  const handleWithoutTemplateSubmit = async () => {
    if (!messageContent.trim() || selectedMrs.length === 0 || !campaignName.trim()) {
      showError('Missing Information', 'Please enter message content, select MRs, and enter a campaign name');
      return;
    }

    try {
      const campaignData = {
        name: campaignName,
        content: messageContent,
        targetMrs: selectedMrs,
        image: selectedImage,
        footerImage: footerImage,
        type: 'custom-messages'
      };

      const formData = new FormData();
      formData.append('name', campaignData.name);
      formData.append('content', campaignData.content);
      formData.append('targetMrs', JSON.stringify(campaignData.targetMrs));
      formData.append('type', campaignData.type);
      if (campaignData.image) {
        formData.append('image', campaignData.image);
      }
      if (campaignData.footerImage) {
        formData.append('footerImage', campaignData.footerImage);
      }

      await api.post('/messages/campaigns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setShowSendConfirmation(true);
      
      // Reset form
      setMessageContent('');
      setSelectedMrs([]);
      setCampaignName('');
      setSelectedImage(null);
      setImagePreview(null);
      setFooterImage(null);
      setFooterImagePreview(null);
    } catch (error) {
      console.error('Error creating campaign:', error);
      showError('Error', 'Failed to create campaign');
    }
  };

  const summaryItems = [
    {
      title: 'Total Campaigns',
      value: (campaigns?.length || 0).toString(),
      icon: <MessageSquare className="h-6 w-6" />,
      color: 'bg-blue-500'
    }
  ];

  const handleSidebarNavigation = (route: string) => {
    navigate(route);
  };

  // CSV Validation Functions
  const validateCSVFile = (csvData: string[][], templateName: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check if CSV has at least 3 rows (A1, A2, A3)
    if (csvData.length < 3) {
      errors.push('CSV file must have at least 3 rows (template name, parameters, and sample data)');
      return { isValid: false, errors };
    }

    // Check A1 cell for template name match
    const a1Value = csvData[0]?.[0]?.trim();
    if (!a1Value || a1Value !== templateName) {
      errors.push(`Template name in A1 cell must match the selected template name "${templateName}". Found: "${a1Value || 'empty'}"`);
    }

    // Check row 2 (parameters row) for empty cells
    const parameterRow = csvData[1];
    if (parameterRow) {
      for (let i = 0; i < parameterRow.length; i++) {
        if (parameterRow[i]?.trim() === '') {
          errors.push(`Parameter row (row 2) has empty cell in column ${String.fromCharCode(65 + i)}2`);
        }
      }
    }

    // Check data rows (starting from row 3) for empty cells
    for (let rowIndex = 2; rowIndex < csvData.length; rowIndex++) {
      const row = csvData[rowIndex];
      if (row) {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          if (row[colIndex]?.trim() === '') {
            errors.push(`Data row ${rowIndex + 1} has empty cell in column ${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`);
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const showError = (title: string, message: string, isSuccess: boolean = false) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorPopup(true);
    // Store success state for styling
    (window as any).lastPopupIsSuccess = isSuccess;
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedTemplate) {
      showError('No Template Selected', 'Please select a template before uploading a recipient list.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const csvData = lines.map(line => line.split(',').map(cell => cell.trim()));

      // Validate CSV
      const validation = validateCSVFile(csvData, selectedTemplate.name);
      if (!validation.isValid) {
        showError('CSV Validation Failed', validation.errors.join('\n'));
        return;
      }

      // If validation passes, process the CSV
      setCsvData(csvData);
      setCsvFile(file);
      setShowCsvPreview(true);
    };
    reader.readAsText(file);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-left">
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
        userRole={user?.role || "Super Admin"}
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

        {/* Konnect Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Konnect</h2>

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
                          {(templates || []).map(template => (
                            <option key={template?._id} value={template?._id}>
                              {template?.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
          <button 
                        onClick={() => {
                          if (selectedTemplate) {
                            handleTemplatePreview(selectedTemplate);
                          } else if (selectedTemplateDropdown) {
                            const template = (templates || []).find(t => t?._id === selectedTemplateDropdown);
                            if (template) handleTemplatePreview(template);
                          }
                        }}
                        disabled={!selectedTemplate && !selectedTemplateDropdown}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
          </button>
                    </div>

                    {/* Template Preview */}
                    {selectedTemplate && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Template Preview:</p>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{selectedTemplate.name}</h4>
          <button 
                              onClick={() => {
                                setSelectedTemplate(null);
                                setSelectedTemplateDropdown('');
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
          </button>
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            {selectedTemplate.content.substring(0, 100)}
                            {selectedTemplate.content.length > 100 && '...'}
                          </div>
                          {selectedTemplate.parameters.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Parameters Used:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedTemplate.parameters.map((param, index) => (
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
                    Upload Recipient List
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
                    Send
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
          
                {/* MR Selection */}
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select MRs</h3>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search MRs by name, ID, or phone..."
                          value={mrSearchTerm}
                          onChange={(e) => setMrSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border-0 bg-gray-100"
                        />
                      </div>
            <button
                        onClick={() => setShowMrSelection(!showMrSelection)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                      >
                        {showMrSelection ? 'Hide' : 'Select MRs'}
            </button>
        </div>

                    {/* MR Selection Modal */}
                    {showMrSelection && (
                      <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <div className="space-y-2">
                          {filteredMrs.length > 0 ? (
                            filteredMrs.map(mr => (
                              <div key={mr._id || mr.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedMrs.includes(mr._id || mr.id)}
                                  onChange={() => handleMrSelection(mr._id || mr.id)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {mr.firstName} {mr.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {mr.mrId} • {mr.phone}
                                  </p>
                </div>
              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-left py-4">No MRs found</p>
                          )}
                </div>
              </div>
                    )}

                    {/* Selected MRs Display */}
                    {selectedMrs.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Selected MRs ({selectedMrs.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedMrs.map(mrId => {
                            const mr = mrs.find(m => (m._id || m.id) === mrId);
                            return (
                              <div key={mrId} className="flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                                <span>{mr?.firstName} {mr?.lastName}</span>
                                <button 
                                  onClick={() => handleMrSelection(mrId)}
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                </div>
                            );
                          })}
              </div>
                </div>
                    )}
              </div>
            </div>

                {/* Message Composition */}
                <div className="bg-white bg-opacity-40 rounded-lg p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Input Fields */}
                    <div className="space-y-6">
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

                      {/* Footer Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Footer Image (Optional)
                        </label>
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFooterImage(file);
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  setFooterImagePreview(e.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                            id="footer-image-upload"
                          />
                          <label
                            htmlFor="footer-image-upload"
                            className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors"
                          >
                            <Upload className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">Click to upload footer image</span>
                          </label>

                          {footerImagePreview && (
                            <div className="relative">
                              <img
                                src={footerImagePreview}
                                alt="Footer preview"
                                className="w-full h-32 object-cover rounded-lg"
                              />
                        <button
                                type="button"
                                onClick={() => {
                                  setFooterImage(null);
                                  setFooterImagePreview('');
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="h-4 w-4" />
                        </button>
                      </div>
                          )}
                    </div>
                      </div>
                    </div>

                    {/* Right Column - Live Preview */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Live Preview
                      </label>
                      <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
                        <div className="bg-white rounded-2xl rounded-tl-md shadow-sm max-w-xs mx-auto">
                          {imagePreview && (
                            <div className="w-full">
                              <img 
                                src={imagePreview} 
                                alt="Header"
                                className="w-full h-24 object-cover rounded-t-2xl"
                        />
                      </div>
                    )}
                          <div className="p-3">
                            <div className="text-gray-800 text-xs leading-relaxed whitespace-pre-wrap">
                              {(() => {
                                if (!messageContent) return 'Start typing your message...';
                                
                                let processedContent = messageContent;
                                
                                // Sample parameter values for live preview
                                const sampleParams = {
                                  'FN': 'John',
                                  'LN': 'Doe',
                                  'FirstName': 'John',
                                  'LastName': 'Doe',
                                  'MRId': 'MR001',
                                  'GroupName': 'North Zone',
                                  'PhoneNumber': '+919876543210',
                                  'Name': 'John Doe',
                                  'Company': 'D-MAK',
                                  'Product': 'New Product',
                                  'Date': new Date().toLocaleDateString(),
                                  'Time': new Date().toLocaleTimeString(),
                                  'Month': new Date().toLocaleDateString('en-US', { month: 'long' }),
                                  'Year': new Date().getFullYear().toString(),
                                  'Target': '100',
                                  'Achievement': '85',
                                  'Location': 'Mumbai',
                                  'City': 'Mumbai',
                                  'State': 'Maharashtra',
                                  'Country': 'India'
                                };
                                
                                // Replace parameters with sample values
                                for (const [param, value] of Object.entries(sampleParams)) {
                                  const regex = new RegExp(`#${param}\\b`, 'g');
                                  processedContent = processedContent.replace(regex, value);
                                }
                                
                                // Replace any remaining parameters with [Sample Value]
                                processedContent = processedContent.replace(/#[A-Za-z0-9_]+/g, '[Sample Value]');
                                
                                return processedContent;
                              })()}
                            </div>
                          </div>
                          {footerImagePreview && (
                            <div className="px-3 pb-3">
                              <img 
                                src={footerImagePreview} 
                                alt="Footer"
                                className="w-full h-16 object-cover rounded-lg"
                        />
                      </div>
                          )}
                      </div>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Konnect Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleWithoutTemplateSubmit}
                    disabled={!messageContent.trim() || selectedMrs.length === 0 || !campaignName.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send
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
                      onChange={handleCSVUpload}
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
                      <div className="text-left">
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
                      <div className="text-left">
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

      {/* Send Confirmation Popup */}
      {showSendConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Messages Queued Successfully!
              </h3>
              <div className="text-sm text-gray-500 mb-6">
                Your messages have been queued for sending. Please check the Dashboard in 5 minutes to see the status.
              </div>
                <button
                onClick={() => setShowSendConfirmation(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                OK
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                (window as any).lastPopupIsSuccess ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {(window as any).lastPopupIsSuccess ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <X className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {errorTitle}
              </h3>
              <div className="text-sm text-gray-500 mb-6 whitespace-pre-line text-left">
                {errorMessage}
              </div>
                <button
                onClick={() => setShowErrorPopup(false)}
                className={`w-full px-4 py-2 text-white rounded-lg ${
                  (window as any).lastPopupIsSuccess 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Close
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;