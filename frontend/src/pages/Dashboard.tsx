import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import TemplatePreviewDialog from '../components/ui/TemplatePreviewDialog';
import RecipientListModal from '../components/ui/RecipientListModal';
import StandardHeader from '../components/StandardHeader';
import CampaignStats from '../components/dashboard/CampaignStats';
import CampaignTable from '../components/dashboard/CampaignTable';
import { campaignsAPI, templateAPI, Campaign } from '../api/campaigns-new';
import { useCampaigns } from '../hooks/useCampaigns';

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
  errorCode?: number;
  errorTitle?: string;
  errorDetails?: string;
  messageId?: string;
}

const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [sortField, setSortField] = useState<keyof CampaignRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);


  // New: use campaigns hook for pagination
  const {
    campaigns: apiCampaigns,
    loading: apiLoading,
    page,
    setPage,
    totalPages,
  } = useCampaigns();

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      
      const transformedCampaigns = (apiCampaigns || []).map((campaign: Campaign) => ({
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
        totalRecipients: campaign.progress?.total || 0,
        sentCount: campaign.progress?.sent || 0,
        failedCount: campaign.progress?.failed || 0,
        successRate: campaign.progress?.successRate || 0,
        status: campaign.status
      }));
      
      setCampaigns(transformedCampaigns);
    } catch (error) {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  // Load campaigns whenever hook data changes (page changes or refetch)
  useEffect(() => {
    loadCampaigns();
  }, [apiCampaigns]);



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



  // Recipient list popup states
  const [showRecipientPopup, setShowRecipientPopup] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<GroupMember[]>([]);

  const handleRecipientListClick = useCallback(async (campaign: CampaignRecord) => {
    try {
      const campaignData = await campaignsAPI.getCampaignById(campaign.id);
      if (!campaignData) return;
      
      const groupMembers: GroupMember[] = (campaignData.recipients || []).map((recipient: any) => ({
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
        errorCode: recipient.errorCode,
        errorTitle: recipient.errorTitle,
        errorDetails: recipient.errorDetails,
        messageId: recipient.messageId
      }));

      setSelectedRecipients(groupMembers);
      setShowRecipientPopup(true);
    } catch (error) {
      setShowRecipientPopup(true);
    }
  }, []);

  // Handle URL parameters to auto-open recipient list modal
  useEffect(() => {
    const shouldShowRecipientList = searchParams.get('showRecipientList');
    const campaignId = searchParams.get('campaignId');
    
    if (shouldShowRecipientList === 'true' && campaignId && campaigns.length > 0) {
      // Find the campaign by ID
      const campaign = campaigns.find(c => c.id === campaignId || c.campaignId === campaignId);
      if (campaign) {
        // Auto-open recipient list for this campaign
        handleRecipientListClick(campaign);
        // Clear the URL parameters after opening the modal
        setSearchParams(new URLSearchParams());
      }
    }
  }, [searchParams, campaigns, setSearchParams, handleRecipientListClick]);

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
        <StandardHeader pageTitle="Dashboard" />

        <CampaignStats campaigns={sortedCampaigns} loading={loading} />

        <CampaignTable
          campaigns={sortedCampaigns}
          onRecipientListClick={handleRecipientListClick}
          onTemplatePreview={handleTemplatePreview}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          loading={loading || apiLoading}
          templateLoading={templateLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        <TemplatePreviewDialog
          isOpen={showTemplatePreview}
          onClose={() => setShowTemplatePreview(false)}
          template={previewTemplate}
          showDownloadButton={false}
          variant="full"
        />

        <RecipientListModal
          isOpen={showRecipientPopup}
          onClose={() => setShowRecipientPopup(false)}
          recipients={selectedRecipients}
          campaignName={selectedRecipients.length > 0 ? 'Campaign Recipients' : undefined}
        />
      </div>
    </div>
  );
};

export default Dashboard;
