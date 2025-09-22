import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import { Template } from '../types';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import { useAuth } from '../contexts/AuthContext';
import TemplatePreviewDialog from '../components/ui/TemplatePreviewDialog';
import TemplateRecipientUploadV2 from '../components/ui/TemplateRecipientUploadV2';
import { useTemplateRecipients } from '../hooks/useTemplateRecipients';
import { useCampaigns } from '../hooks/useCampaigns';
import { useCampaignActions } from '../hooks/useCampaignActions';
import { Campaign, campaignsAPI } from '../api/campaigns-new';
import { downloadTemplateCSV, cleanErrorMessage } from '../utils/campaignUtils';
import TemplateMessagesTab from '../components/campaigns/TemplateMessagesTab';
import CustomMessagesTab from '../components/campaigns/CustomMessagesTab';
import CreateRecipientListModal from '../components/campaigns/CreateRecipientListModal';
import SendConfirmationModal from '../components/campaigns/SendConfirmationModal';
import ErrorPopup from '../components/campaigns/ErrorPopup';

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { campaigns = [], templates = [], mrs = [], loading } = useCampaigns();
  const { createWithTemplateCampaign, createCustomMessageCampaign, createRecipientList } = useCampaignActions();
  
  const [activeTab, setActiveTab] = useState<'with-template' | 'custom-messages'>('with-template');

  // Template Messages Tab States
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [selectedTemplateDropdown, setSelectedTemplateDropdown] = useState<string>('');
  const [campaignName, setCampaignName] = useState('');
  const [selectedRecipientList, setSelectedRecipientList] = useState<any>(null);

  // Preview states
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Without Template Tab States
  const [messageContent, setMessageContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [footerImage, setFooterImage] = useState<File | null>(null);
  const [footerImagePreview, setFooterImagePreview] = useState<string | null>(null);

  // MR Search and Selection States
  const [mrSearchTerm, setMrSearchTerm] = useState('');
  const [selectedMrs, setSelectedMrs] = useState<string[]>([]);
  const [mrSortField, setMrSortField] = useState<'mrId' | 'firstName' | 'phone' | 'group'>('mrId');
  const [mrSortDirection, setMrSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal States
  const [showCreateRecipientList, setShowCreateRecipientList] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [showRecipientUpload, setShowRecipientUpload] = useState(false);
  const [uploadTemplate, setUploadTemplate] = useState<Template | null>(null);

  // Campaign Activation States
  const [activatingCampaigns, setActivatingCampaigns] = useState<Set<string>>(new Set());


  // Handler functions
  const handleWithTemplateSubmit = async () => {
    if (!selectedTemplate || !selectedRecipientList || !campaignName.trim()) {
      showError('Missing Information', 'Please select a template, recipient list, and enter a campaign name');
      return;
    }

    try {
      await createWithTemplateCampaign({
        name: campaignName,
        templateId: selectedTemplate._id,
        recipientListId: selectedRecipientList._id,
        type: 'with-template'
      });
      setShowSendConfirmation(true);
      resetTemplateForm();
    } catch (error) {
      showError('Error', 'Failed to create campaign');
    }
  };

  const handleCustomMessageSubmit = async () => {
    if (!messageContent.trim() || selectedMrs.length === 0 || !campaignName.trim()) {
      showError('Missing Information', 'Please enter message content, select MRs, and enter a campaign name');
      return;
    }

    try {
      await createCustomMessageCampaign({
        name: campaignName,
        content: messageContent,
        targetMrs: selectedMrs,
        image: selectedImage ?? undefined,
        footerImage: footerImage ?? undefined,
        type: 'custom-messages'
      });
      setShowSendConfirmation(true);
      resetCustomMessageForm();
    } catch (error) {
      showError('Error', 'Failed to create campaign');
    }
  };

  const handleCreateRecipientList = async (data: {
    name: string;
    description: string;
    csvFile: File;
  }) => {
    try {
      await createRecipientList(data);
      showError('Success', 'Recipient list created successfully!', true);
    } catch (error) {
      showError('Error', 'Failed to create recipient list');
    }
  };

  const handleActivateCampaign = async (campaignId: string) => {
    try {
      setActivatingCampaigns(prev => new Set(prev).add(campaignId));
      
      // Update campaign status to 'sending'
      await campaignsAPI.updateCampaignStatus(campaignId, 'sending');
      
      showError('Success', 'Campaign activated and messages are being sent!', true);
      
      // Refresh campaigns data
      // Note: In a real implementation, you would trigger a refresh here
      
    } catch (error: any) {
      console.error('Error activating campaign:', error);
      const errorMessage = error.response?.data?.message || 'Failed to activate campaign';
      showError('Error', errorMessage);
    } finally {
      setActivatingCampaigns(prev => {
        const newSet = new Set(prev);
        newSet.delete(campaignId);
        return newSet;
      });
    }
  };

  const resetTemplateForm = () => {
    setSelectedTemplate(null);
    setSelectedRecipientList(null);
    setCampaignName('');
    setSelectedTemplateDropdown('');
  };

  const resetCustomMessageForm = () => {
    setMessageContent('');
    setSelectedMrs([]);
    setCampaignName('');
    setSelectedImage(null);
    setImagePreview(null);
    setFooterImage(null);
    setFooterImagePreview(null);
  };

  // Utility functions
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

  const handleTemplatePreview = (template: Template) => {
    setPreviewTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleBulkUploadRecipients = (template: Template) => {
    setUploadTemplate(template);
    setShowRecipientUpload(true);
  };

  const showError = (title: string, message: string, isSuccess: boolean = false) => {
    const cleanedMessage = cleanErrorMessage(message);
    setErrorTitle(title);
    setErrorMessage(cleanedMessage);
    setShowErrorPopup(true);
    (window as any).lastPopupIsSuccess = isSuccess;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Get recipients for the preview template
  const { recipients: previewRecipients, fetchRecipients: fetchPreviewRecipients } = useTemplateRecipients(previewTemplate?._id);
  
  // Get recipients for the selected template (for campaigns)
  const { recipients: selectedTemplateRecipients, fetchRecipients: fetchSelectedTemplateRecipients } = useTemplateRecipients(selectedTemplate?._id);


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
          showExportButtons={false}
        />

        {/* Separator Line */}
        <div className="border-b-2 border-indigo-500 my-6"></div>

        {/* Konnect Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Konnect</h2>

        {/* Main Content Area */}
        <CommonFeatures
          summaryItems={summaryItems}
          showExportBlock={false}
        >
          <div className="space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
              <div className="flex space-x-1">
                {[
                  { key: 'with-template', label: 'Template Messages' },
                  { key: 'custom-messages', label: 'Custom Messages' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.key
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Messages Tab */}
            {activeTab === 'with-template' && (
              <TemplateMessagesTab
                templates={templates}
                campaignName={campaignName}
                setCampaignName={setCampaignName}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                selectedTemplateDropdown={selectedTemplateDropdown}
                setSelectedTemplateDropdown={setSelectedTemplateDropdown}
                selectedRecipientList={selectedRecipientList}
                setSelectedRecipientList={setSelectedRecipientList}
                onTemplatePreview={handleTemplatePreview}
                onBulkUploadRecipients={handleBulkUploadRecipients}
                onDownloadTemplateCSV={downloadTemplateCSV}
                onSubmit={handleWithTemplateSubmit}
                showError={showError}
                onShowCreateRecipientList={() => setShowCreateRecipientList(true)}
              />
            )}

            {/* Custom Messages Tab */}
            {activeTab === 'custom-messages' && (
              <CustomMessagesTab
                campaignName={campaignName}
                setCampaignName={setCampaignName}
                messageContent={messageContent}
                setMessageContent={setMessageContent}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                footerImage={footerImage}
                setFooterImage={setFooterImage}
                footerImagePreview={footerImagePreview}
                setFooterImagePreview={setFooterImagePreview}
                mrs={mrs}
                selectedMrs={selectedMrs}
                setSelectedMrs={setSelectedMrs}
                mrSearchTerm={mrSearchTerm}
                setMrSearchTerm={setMrSearchTerm}
                mrSortField={mrSortField}
                setMrSortField={setMrSortField}
                mrSortDirection={mrSortDirection}
                setMrSortDirection={setMrSortDirection}
                onSubmit={handleCustomMessageSubmit}
              />
            )}

            {/* Campaigns List Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Your Campaigns</h3>
                <span className="text-sm text-gray-500">{campaigns?.length || 0} campaigns</span>
              </div>

              {campaigns && campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-md font-medium text-gray-900">{campaign.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                              campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                              campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                              campaign.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {campaign.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-medium">Template:</span> {campaign.template.metaTemplateName || campaign.template.name}</p>
                            <p><span className="font-medium">Recipients:</span> {campaign.recipientList.name} ({campaign.progress.total} MRs)</p>
                            <p><span className="font-medium">Progress:</span> {campaign.progress.sent}/{campaign.progress.total} sent ({campaign.progress.successRate}%)</p>
                            <p><span className="font-medium">Created:</span> {new Date(campaign.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {campaign.status === 'draft' || campaign.status === 'pending' ? (
                            <button
                              onClick={() => handleActivateCampaign(campaign.campaignId)}
                              disabled={activatingCampaigns.has(campaign.campaignId)}
                              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              {activatingCampaigns.has(campaign.campaignId) ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Activating...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4" />
                                  <span>Activate Campaign</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="text-sm text-gray-500">
                              {campaign.status === 'sending' && 'Messages being sent...'}
                              {campaign.status === 'completed' && 'Campaign completed'}
                              {campaign.status === 'failed' && 'Campaign failed'}
                              {campaign.status === 'cancelled' && 'Campaign cancelled'}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      {campaign.status === 'sending' || campaign.status === 'completed' ? (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{campaign.progress.successRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${campaign.progress.successRate}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                  <p className="text-gray-500">Create your first campaign using the tabs above.</p>
                  {loading && <p className="text-sm text-gray-400 mt-2">Loading campaigns...</p>}
                </div>
              )}
            </div>

          </div>
        </CommonFeatures>

        {/* Create Recipient List Modal */}
        <CreateRecipientListModal
          isOpen={showCreateRecipientList}
          onClose={() => setShowCreateRecipientList(false)}
          onCreateRecipientList={handleCreateRecipientList}
          showError={showError}
          mrs={mrs}
          selectedTemplate={selectedTemplate}
        />

        {/* Template Preview Modal */}
        <TemplatePreviewDialog
          isOpen={showTemplatePreview}
          onClose={() => setShowTemplatePreview(false)}
          template={{
            ...previewTemplate,
            recipientLists: previewTemplate?._id === selectedTemplate?._id ? selectedTemplateRecipients : previewRecipients
          } as Template}
          onDownloadRecipientList={downloadTemplateCSV}
          onBulkUploadRecipients={handleBulkUploadRecipients}
          showDownloadButton={true}
          showBulkUploadButton={true}
          variant="full"
        />

        {/* Recipient Upload Modal */}
        {showRecipientUpload && uploadTemplate && (
          <TemplateRecipientUploadV2
            template={uploadTemplate}
            showError={showError}
            onUploadSuccess={() => {
              // Refresh recipients for the uploaded template
              if (uploadTemplate._id === selectedTemplate?._id) {
                fetchSelectedTemplateRecipients(uploadTemplate._id);
              }
              if (previewTemplate?._id === uploadTemplate._id) {
                fetchPreviewRecipients(previewTemplate._id);
              }
            }}
            onClose={() => {
              setShowRecipientUpload(false);
              setUploadTemplate(null);
            }}
          />
        )}

        {/* Send Confirmation Modal */}
        <SendConfirmationModal
          isOpen={showSendConfirmation}
          onClose={() => setShowSendConfirmation(false)}
        />

        {/* Error/Success Popup */}
        <ErrorPopup
          isOpen={showErrorPopup}
          onClose={() => setShowErrorPopup(false)}
          title={errorTitle}
          message={errorMessage}
          isSuccess={(window as any).lastPopupIsSuccess}
        />
      </div>
    </div>
  );
};

export default Campaigns;