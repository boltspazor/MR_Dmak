import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import TemplatePreviewManager, { useTemplatePreview } from '../components/templates/TemplatePreviewManager';
import RecipientListModal from '../components/ui/RecipientListModal';
import StandardHeader from '../components/StandardHeader';
import CampaignStats from '../components/dashboard/CampaignStats';
import CampaignTable from '../components/dashboard/CampaignTable';
import AdvancedCampaignSearch from '../components/dashboard/AdvancedCampaignSearch';
import { campaignsAPI, Campaign } from '../api/campaigns-new';
import { templateApi } from '../api/templates';
import { useCampaigns } from '../hooks/useCampaigns';
import { CampaignFilterParams } from '../types/campaign.types';
import { Template } from '../types';

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
  sendStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
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
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
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
  const [overallTotal, setOverallTotal] = useState<number>(0);

  // Template preview hook
  const {
    showPreview,
    previewTemplate,
    closePreview,
    openPreview,
  } = useTemplatePreview();

  // Enhanced campaigns hook for server-side operations
  const {
    campaigns: apiCampaigns,
    loading: apiLoading,
    totalPages,
    total,
    fetchCampaigns,
  } = useCampaigns();

  // Recipient list popup states
  const [showRecipientPopup, setShowRecipientPopup] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<GroupMember[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRecord | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

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

    params.sortField = sortField;
    params.sortDirection = sortDirection;

    console.log('Dashboard: Fetching with params:', params);
    fetchCampaigns(params);

    (async () => {
      try {
        const totalRes = await campaignsAPI.getCampaignTotalCount();
        console.log('Dashboard: overall total (unfiltered):', totalRes?.total);
      } catch (err) {
        console.warn('Dashboard: failed to fetch debug overall totals', err);
      }
    })();
  }, [currentPage, searchTerm, statusFilter, sortField, sortDirection, fetchCampaigns]);

  // Fetch overall total campaigns
  useEffect(() => {
    let mounted = true;
    const fetchOverall = async () => {
      try {
        const res = await campaignsAPI.getCampaignTotalCount();
        if (mounted && res && typeof res.total === 'number') {
          setOverallTotal(res.total);
          return;
        }

        const fallback = await campaignsAPI.getCampaignCount();
        if (mounted && fallback && typeof fallback.total === 'number') {
          setOverallTotal(fallback.total);
        }
      } catch (err) {
        console.warn('Failed to fetch overall campaigns total:', err);
      }
    };

    fetchOverall();

    return () => { mounted = false; };
  }, []);

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
        sendStatus: campaign.status as 'pending' | 'in-progress' | 'completed' | 'failed',
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

  useEffect(() => {
    loadCampaigns();
  }, [apiCampaigns]);

  const sortedCampaigns = campaigns;

  const handleSort = (field: keyof CampaignRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const handleTemplatePreview = async (campaign: CampaignRecord) => {
    try {
      setTemplateLoading(true);

      const templateId = campaign.template?.id;

      if (!templateId) {
        // Fallback to basic template info
        const basicTemplate: Partial<Template> = {
          name: campaign.template.name,
          metaTemplateName: campaign.template.metaTemplateName,
          isMetaTemplate: campaign.template.isMetaTemplate,
          metaStatus: campaign.template.metaStatus,
        };
        openPreview(basicTemplate as Template);
        return;
      }

      console.log('Fetching template for preview with ID:', templateId);
      const response = await templateApi.getById(templateId);
      const template = response.data;

      openPreview(template as Template);
    } catch (error) {
      console.error('Failed to load template preview:', error);
      // Fallback to basic template info on error
      const basicTemplate: Partial<Template> = {
        name: campaign.template.name,
        metaTemplateName: campaign.template.metaTemplateName,
        isMetaTemplate: campaign.template.isMetaTemplate,
        metaStatus: campaign.template.metaStatus,
      };
      openPreview(basicTemplate as Template);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleRecipientListClick = useCallback(async (campaign: CampaignRecord) => {
    try {
      setSelectedCampaign(campaign);

      const campaignData = await campaignsAPI.getCampaignById(campaign.id);
      if (!campaignData) {
        setSelectedRecipients([]);
        setShowRecipientPopup(true);
        return;
      }

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
      console.error('Error fetching campaign recipients:', error);
      setSelectedRecipients([]);
      setShowRecipientPopup(true);
    }
  }, []);

  // Handle URL parameters to auto-open recipient list modal
  useEffect(() => {
    const shouldShowRecipientList = searchParams.get('showRecipientList');
    const campaignId = searchParams.get('campaignId');

    if (shouldShowRecipientList === 'true' && campaignId && campaigns.length > 0) {
      const campaign = campaigns.find(c => c.id === campaignId || c.campaignId === campaignId);
      if (campaign) {
        handleRecipientListClick(campaign);
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

        <AdvancedCampaignSearch
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={(term) => {
            console.log('🔍 Dashboard - onSearchChange called with term:', term);
            setSearchTerm(term);
            setCurrentPage(1);
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
          filteredCount={total || 0}
          totalCount={overallTotal}
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
          statusFilter={statusFilter}
          searchTerm={searchTerm}
          filteredTotal={total}
        />

        {/* Template Preview Manager - uses compact variant for dashboard */}
        <TemplatePreviewManager
          isOpen={showPreview}
          template={previewTemplate}
          onClose={closePreview}
          variant="full"
          showDownloadButton={true}
          showBulkUploadButton={true}
        />

        <RecipientListModal
          isOpen={showRecipientPopup}
          onClose={() => {
            setShowRecipientPopup(false);
            setSelectedCampaign(null);
          }}
          recipients={selectedRecipients}
          campaignName={selectedCampaign?.campaignName || 'Campaign Recipients'}
          campaignId={selectedCampaign?.id}
          showExportButton={true}
        />
      </div>
    </div>
  );
};

export default Dashboard;
