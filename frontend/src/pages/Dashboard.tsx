import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import TemplatePreviewDialog from '../components/ui/TemplatePreviewDialog';
import RecipientListModal from '../components/ui/RecipientListModal';
import StandardHeader from '../components/StandardHeader';
import CampaignStats from '../components/dashboard/CampaignStats';
import CampaignTable from '../components/dashboard/CampaignTable';
import AdvancedCampaignSearch from '../components/dashboard/AdvancedCampaignSearch';
import { campaignsAPI, Campaign } from '../api/campaigns-new';
import { templateApi } from '../api/templates';
import { useCampaigns } from '../hooks/useCampaigns';
import { CampaignFilterParams } from '../types/campaign.types';

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
  sendStatus: 'completed' | 'sending' | 'pending' | 'failed' | 'cancelled' | 'draft';
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

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);


  // Enhanced campaigns hook for server-side operations
  const {
    campaigns: apiCampaigns,
    loading: apiLoading,

    totalPages,
    total,
    fetchCampaigns,
  } = useCampaigns();

  // URL parameter management
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get('search') || '';
    const urlStatus = urlParams.get('status') || '';
    const urlPage = parseInt(urlParams.get('page') || '1');
    const urlSort = urlParams.get('sortField') || 'date';
    const urlDirection = (urlParams.get('sortDirection') as 'asc' | 'desc') || 'desc';

    setSearchTerm(urlSearch);
    setStatusFilter(urlStatus);
    setCurrentPage(urlPage);
    setSortField(urlSort as keyof CampaignRecord);
    setSortDirection(urlDirection);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const urlParams = new URLSearchParams();
    if (searchTerm) urlParams.set('search', searchTerm);
    if (statusFilter) urlParams.set('status', statusFilter);
    if (currentPage > 1) urlParams.set('page', currentPage.toString());
    if (sortField !== 'date') urlParams.set('sortField', sortField);
    if (sortDirection !== 'desc') urlParams.set('sortDirection', sortDirection);

    const newUrl = urlParams.toString() ? `${window.location.pathname}?${urlParams.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [searchTerm, statusFilter, currentPage, sortField, sortDirection]);

  // Fetch data when filters or pagination changes
  useEffect(() => {
    const params: CampaignFilterParams = {
      page: currentPage,
      limit: 10
    };

    if (searchTerm) params.search = searchTerm;
    if (statusFilter) params.status = statusFilter;
    
    // Add server-side sorting
    params.sortField = sortField;
    params.sortDirection = sortDirection;

    console.log('Dashboard: Fetching with params:', params);
    console.log('Current filters - searchTerm:', searchTerm, 'statusFilter:', statusFilter);
    fetchCampaigns(params);
  }, [currentPage, searchTerm, statusFilter, sortField, sortDirection, fetchCampaigns]);

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
        sendStatus: campaign.status as 'completed' | 'sending' | 'pending' | 'failed' | 'cancelled' | 'draft',
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
    if (apiCampaigns && apiCampaigns.length > 0) {
      loadCampaigns();
    }
  }, [apiCampaigns]);



  // Use campaigns directly since sorting is now handled server-side
  const sortedCampaigns = campaigns;

  const handleSort = (field: keyof CampaignRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
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
      const response = await templateApi.getById(templateId);
      const template = response.data;
      console.log('Template for preview:', template);
      
      // Set the full template data for preview
      setPreviewTemplate({
        name: template.name,
        metaTemplateName: (template as any).metaTemplateName,
        isMetaTemplate: (template as any).isMetaTemplate,
        metaStatus: (template as any).metaStatus,
        content: template.content,
        type: (template as any).type,
        imageUrl: template.imageUrl,
        footerImageUrl: (template as any).footerImageUrl,
        parameters: (template as any).parameters,
        metaCategory: (template as any).metaCategory,
        metaLanguage: (template as any).metaLanguage
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

        {/* Advanced Search Component */}
        <AdvancedCampaignSearch
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={(term) => {
            console.log('🔍 Dashboard - onSearchChange called with term:', term);
            setSearchTerm(term);
            setCurrentPage(1);
            // Update URL immediately
            const params = new URLSearchParams(window.location.search);
            if (term) {
              params.set('search', term);
            } else {
              params.delete('search');
            }
            params.set('page', '1');
            window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
          }}
          onStatusChange={(status) => {
            console.log('🔍 Dashboard - onStatusChange called with status:', status);
            setStatusFilter(status);
            setCurrentPage(1);
            // Update URL immediately
            const params = new URLSearchParams(window.location.search);
            if (status) {
              params.set('status', status);
            } else {
              params.delete('status');
            }
            params.set('page', '1');
            window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
          }}
          onClearFilters={clearFilters}
          filteredCount={campaigns.length}
          totalCount={total || 0}
        />

        <CampaignTable
          campaigns={sortedCampaigns}
          onRecipientListClick={handleRecipientListClick}
          onTemplatePreview={handleTemplatePreview}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          loading={loading || apiLoading}
          templateLoading={templateLoading}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
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
