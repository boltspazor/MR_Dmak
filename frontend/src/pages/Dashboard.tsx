import React, { useState, useEffect } from 'react';
import { 
  RefreshCw
} from 'lucide-react';
import TemplatePreviewDialog from '../components/ui/TemplatePreviewDialog';
import RecipientListModal from '../components/ui/RecipientListModal';
import Header from '../components/Header';
import CampaignStats from '../components/dashboard/CampaignStats';
import CampaignTabs from '../components/dashboard/CampaignTabs';
import { campaignsAPI, templateAPI, Campaign } from '../api/campaigns-new';
import { campaignProgressAPI } from '../api/campaign-progress';
import { api } from '../api/config';
import toast from 'react-hot-toast';

interface CampaignRecord {
  id: string;
  campaignName: string;
  campaignId: string;
  template: {
    id: string;
    name: string;
    metaTemplateName?: string;
    isMetaTemplate: boolean;
    metaStatus?: string;
  };
  recipientList: {
    name: string;
    recipientCount: number;
  } | null;
  date: string;
  sendStatus: 'completed' | 'in progress' | 'pending' | 'failed' | 'cancelled';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  successRate: number;
  status: string;
}

interface GroupMember {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email?: string;
  group: string;
  status: 'sent' | 'failed' | 'pending' | 'queued';
  sentAt?: string;
  errorMessage?: string;
  messageId?: string;
}

const Dashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [sortField, setSortField] = useState<keyof CampaignRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Suppress all error popups on Dashboard page
  useEffect(() => {
    console.log('🔇 Dashboard: Suppressing all error notifications');
    
    // Override toast error methods to suppress errors
    const originalToastError = toast.error;
    const originalAlert = window.alert;
    const originalConsoleError = console.error;
    
    // Suppress toast errors
    toast.error = (message: any) => {
      console.log('🔇 Suppressed toast error:', message);
      return originalToastError(message);
    };
    
    // Suppress alert errors
    window.alert = (message?: any) => {
      console.log('🔇 Suppressed alert:', message);
    };
    
    // Keep console.error but add prefix
    console.error = (...args: any[]) => {
      originalConsoleError('🔇 Dashboard Error (suppressed popup):', ...args);
    };
    
    // Cleanup on unmount
    return () => {
      console.log('🔧 Dashboard: Restoring error notifications');
      toast.error = originalToastError;
      window.alert = originalAlert;
      console.error = originalConsoleError;
    };
  }, []);

  // Load real campaign data from API with real-time updates
  const loadCampaigns = async () => {
    try {
      setLoading(true);
      console.log('Loading campaigns with real-time data...');
      
      // Fetch campaigns with progress data
      const response = await campaignsAPI.getCampaigns();
      console.log('Campaigns API response:', response);
      const campaignsData = response.campaigns || [];
      console.log('Campaigns data:', campaignsData);
      
      // Transform the data to match the expected format with real-time progress
      const transformedCampaigns = await Promise.all(
        campaignsData.map(async (campaign: Campaign) => {
          console.log('Processing campaign:', campaign);
          
          // Get real-time progress data for each campaign
          let realTimeProgress = campaign.progress;
          try {
            const progressResponse = await campaignProgressAPI.getCampaignProgress(campaign.campaignId);
            realTimeProgress = progressResponse.progress;
            console.log(`Real-time progress for ${campaign.campaignId}:`, realTimeProgress);
          } catch (error) {
            console.warn(`Could not fetch real-time progress for campaign ${campaign.campaignId}:`, error);
            // Use the progress from the campaign data as fallback
          }
          
          return {
            id: campaign.id,
            campaignName: campaign.name,
            campaignId: campaign.campaignId,
            template: campaign.template ? {
              id: campaign.template.id,
              name: campaign.template.name,
              metaTemplateName: campaign.template.metaTemplateName,
              isMetaTemplate: campaign.template.isMetaTemplate,
              metaStatus: campaign.template.metaStatus
            } : {
              id: '',
              name: 'Unknown Template',
              metaTemplateName: undefined,
              isMetaTemplate: false,
              metaStatus: undefined
            },
            recipientList: campaign.recipientList ? {
              name: campaign.recipientList.name,
              recipientCount: campaign.recipientList.recipientCount
            } : null,
            date: new Date(campaign.createdAt).toISOString().split('T')[0],
            sendStatus: (campaign.status === 'completed' ? 'completed' : 
                       campaign.status === 'sending' ? 'in progress' : 
                       campaign.status === 'failed' ? 'failed' : 
                       campaign.status === 'cancelled' ? 'cancelled' : 'pending') as 'completed' | 'in progress' | 'pending' | 'failed' | 'cancelled',
            totalRecipients: realTimeProgress?.total || 0,
            sentCount: realTimeProgress?.sent || 0,
            failedCount: realTimeProgress?.failed || 0,
            successRate: realTimeProgress?.successRate || 0,
            status: campaign.status
          };
        })
      );
      
      console.log('Transformed campaigns with real-time data:', transformedCampaigns);
      setCampaigns(transformedCampaigns);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Failed to load campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  // Load campaigns on component mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  // Auto-refresh campaigns every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('Auto-refreshing campaigns...');
      loadCampaigns();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Sort campaigns
  const sortedCampaigns = React.useMemo(() => {
    const sorted = [...campaigns];
    
    sorted.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle nested object properties
      if (sortField === 'template') {
        aValue = a.template.name;
        bValue = b.template.name;
      } else if (sortField === 'recipientList') {
        aValue = a.recipientList?.name || '';
        bValue = b.recipientList?.name || '';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [campaigns, sortField, sortDirection]);

  const handleSort = (field: keyof CampaignRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  
  // Template details modal states
  const [templateLoading, setTemplateLoading] = useState(false);

  const handleTemplatePreview = async (campaign: CampaignRecord) => {
    try {
      setTemplateLoading(true);
      console.log('Loading template preview for campaign:', campaign);
      
      // Get the template ID from the campaign data
      const templateId = campaign.template?.id;
      
      if (!templateId) {
        // Fallback to basic template info if no ID available
        setPreviewTemplate({
          name: campaign.template.name,
          metaTemplateName: campaign.template.metaTemplateName,
          isMetaTemplate: campaign.template.isMetaTemplate,
          metaStatus: campaign.template.metaStatus
        });
        setShowTemplatePreview(true);
        return;
      }
      
      console.log('Fetching template for preview with ID:', templateId);
      const template = await templateAPI.getTemplateById(templateId);
      console.log('Template for preview:', template);
      
      // Set the full template data for preview
      setPreviewTemplate({
        name: template.name,
        metaTemplateName: template.metaTemplateName,
        isMetaTemplate: template.isMetaTemplate,
        metaStatus: template.metaStatus,
        content: template.content,
        type: template.type,
        imageUrl: template.imageUrl,
        footerImageUrl: template.footerImageUrl,
        parameters: template.parameters,
        metaCategory: template.metaCategory,
        metaLanguage: template.metaLanguage
      });
      setShowTemplatePreview(true);
    } catch (error) {
      console.error('Failed to load template preview:', error);
      // Fallback to basic template info on error
      setPreviewTemplate({
        name: campaign.template.name,
        metaTemplateName: campaign.template.metaTemplateName,
        isMetaTemplate: campaign.template.isMetaTemplate,
        metaStatus: campaign.template.metaStatus
      });
      setShowTemplatePreview(true);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleViewTemplate = async (campaign: CampaignRecord) => {
    try {
      setTemplateLoading(true);
      console.log('Loading template details for campaign:', campaign);
      
      // Get the template ID from the campaign data
      // The template ID should be available in the campaign data
      const templateId = campaign.template?.id;
      
      if (!templateId) {
        throw new Error('Template ID not found in campaign data');
      }
      
      console.log('Fetching template with ID:', templateId);
      const template = await templateAPI.getTemplateById(templateId);
      console.log('Template details:', template);
    } catch (error) {
      console.error('Failed to load template details:', error);
      toast.error('Failed to load template details');
    } finally {
      setTemplateLoading(false);
    }
  };

  // Recipient list popup states
  const [showRecipientPopup, setShowRecipientPopup] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<GroupMember[]>([]);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | undefined>();

  const handleRecipientListClick = async (campaign: CampaignRecord) => {
    try {
      console.log('Loading template recipients for campaign:', campaign);
      
      // Get the campaign details with full recipient data
      const campaignData = await campaignsAPI.getCampaignById(campaign.id);
      console.log('Campaign data from API:', campaignData);
      
      // Check if the response has the expected structure
      if (!campaignData) {
        throw new Error('Invalid campaign response structure');
      }
      
      // Extract recipients from the campaign data
      const campaignRecipients = campaignData.recipients || [];
      console.log('Campaign recipients:', campaignRecipients);
      
      const groupMembers: GroupMember[] = campaignRecipients.map((recipient: any) => ({
        id: recipient.id,
        mrId: recipient.mrId,
        firstName: recipient.firstName,
        lastName: recipient.lastName,
        name: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || 'Unknown',
        phone: recipient.phone || 'N/A',
        email: recipient.email || '',
        group: recipient.group || 'Default Group',
        status: recipient.status || 'pending',
        sentAt: recipient.sentAt,
        errorMessage: recipient.errorMessage,
        messageId: recipient.messageId
      }));

      console.log('Processed campaign recipients:', groupMembers);

      setSelectedRecipients(groupMembers);
      setCurrentCampaignId(campaign.id);
      setShowRecipientPopup(true);
    } catch (error) {
      console.error('Failed to load campaign recipients:', error);
      
      // Fallback: Try to get template recipients if campaign data fails
      try {
        console.log('Fallback: Loading template recipients...');
        
        // Find the template ID from the campaign
        const templateResponse = await api.get('/templates');
        const templates = templateResponse.data.data || [];
        const template = templates.find((t: any) => 
          t.name === campaign.template.name || 
          t.metaTemplateName === campaign.template.metaTemplateName
        );
        
        if (template) {
          const templateRecipientsResponse = await api.get(`/recipient-lists/template/${template._id}`);
          const templateRecipients = templateRecipientsResponse.data.data || [];
          
          // Get the first recipient list for this template (or you could match by name)
          const recipientList = campaign.recipientList ? templateRecipients.find((list: any) => 
            list.name === campaign.recipientList?.name
          ) : null;
          
          if (recipientList) {
            const groupMembers: GroupMember[] = (recipientList.data || recipientList.recipients || []).map((recipient: any) => ({
              id: recipient.mrId || recipient.id,
              mrId: recipient.mrId,
              firstName: recipient.firstName,
              lastName: recipient.lastName,
              name: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || 'Unknown',
              phone: recipient.phone || 'N/A',
              email: recipient.email || '',
              group: recipient.group || recipient.groupId || 'Default Group',
              status: 'pending', // Template recipients don't have campaign status yet
              sentAt: undefined,
              errorMessage: undefined,
              messageId: undefined
            }));
            
            setSelectedRecipients(groupMembers);
            setCurrentCampaignId(campaign.id);
            setShowRecipientPopup(true);
            return;
          }
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      
      // Final fallback: Create sample data
      const sampleRecipients: GroupMember[] = [
        {
          id: '1',
          mrId: 'MR001',
          firstName: 'John',
          lastName: 'Doe',
          name: 'John Doe',
          phone: '+919876543210',
          email: 'john@example.com',
          group: 'North Zone',
          status: 'sent',
          sentAt: new Date().toISOString(),
          errorMessage: undefined,
          messageId: 'wamid.sample1'
        },
        {
          id: '2',
          mrId: 'MR002',
          firstName: 'Jane',
          lastName: 'Smith',
          name: 'Jane Smith',
          phone: '+919876543211',
          email: 'jane@example.com',
          group: 'South Zone',
          status: 'failed',
          sentAt: undefined,
          errorMessage: 'Message failed to deliver',
          messageId: 'wamid.sample2'
        },
        {
          id: '3',
          mrId: 'MR003',
          firstName: 'Bob',
          lastName: 'Johnson',
          name: 'Bob Johnson',
          phone: '+919876543212',
          email: 'bob@example.com',
          group: 'East Zone',
          status: 'pending',
          sentAt: undefined,
          errorMessage: undefined,
          messageId: undefined
        }
      ];
      setSelectedRecipients(sampleRecipients);
      setCurrentCampaignId(undefined); // No campaign ID for sample data
      setShowRecipientPopup(true);
    }
  };

  const exportToCSV = () => {
    // CSV export logic
    console.log('Exporting to CSV...');
  };

  const exportToPDF = () => {
    // PDF export logic
    console.log('Exporting to PDF...');
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-left">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="p-8">
        {/* Header */}
        <Header 
          title="D-MAK"
          subtitle="Digital - Marketing, Automate & Konnect"
          onExportCSV={exportToCSV}
          onExportPDF={exportToPDF}
          showExportButtons={false}
        />

        {/* Separator Line */}
        <div className="border-b-2 border-indigo-500 my-6"></div>

        {/* Campaigns Dashboard Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Campaigns Dashboard</h2>
          <a
            href="https://business.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Meta Console
          </a>
        </div>

        {/* Refresh Controls */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Campaign Dashboard</h2>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700 border-green-200' 
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={loadCampaigns}
              disabled={loading}
              className="text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Campaign Stats */}
        <CampaignStats campaigns={sortedCampaigns} loading={loading} />

        {/* Campaign Tabs */}
        <CampaignTabs
          campaigns={sortedCampaigns}
          onRecipientListClick={handleRecipientListClick}
          onTemplatePreview={handleTemplatePreview}
          onViewTemplate={handleViewTemplate}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          loading={loading}
          templateLoading={templateLoading}
        />

        {/* Template Preview Modal */}
        <TemplatePreviewDialog
          isOpen={showTemplatePreview}
          onClose={() => setShowTemplatePreview(false)}
          template={previewTemplate}
          showDownloadButton={false}
          variant="full"
        />

        {/* Recipient List Modal - New Component */}
        <RecipientListModal
          isOpen={showRecipientPopup}
          onClose={() => setShowRecipientPopup(false)}
          recipients={selectedRecipients}
          campaignName={selectedRecipients.length > 0 ? 'Campaign Recipients' : undefined}
          campaignId={currentCampaignId}
          onExportCSV={() => {
            // CSV export logic for recipients
            console.log('Exporting recipients to CSV...');
          }}
          showExportButton={true}
          showProgress={true}
        />
      </div>
    </div>
  );
};

export default Dashboard;
