// pages/Dashboard.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
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

type SendStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

interface CampaignRecord {
  id: string;
  campaignName: string;
  campaignId: string;
  template: { id: string; name: string; metaTemplateName?: string; isMetaTemplate: boolean; metaStatus?: string };
  recipientList: { name: string; recipientCount: number } | null;
  date: string;
  sendStatus: SendStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  successRate: number;
  status: string;
}

interface GroupMember {
  id: string; mrId: string; firstName: string; lastName: string; name: string; phone: string; email?: string;
  group: string; status: 'pending'|'sent'|'delivered'|'read'|'failed'; sentAt?: string; errorMessage?: string;
  errorCode?: number; errorTitle?: string; errorDetails?: string; messageId?: string;
}

const Dashboard: React.FC = () => {
  // URL params
  const [searchParams, setSearchParams] = useSearchParams();
  const [hydrated, setHydrated] = useState(false);

  // Filters/sort/pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof CampaignRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc'|'desc'>('desc');

  // Totals
  const [overallTotal, setOverallTotal] = useState<number>(0);

  // API hook
  const { campaigns: apiCampaigns, loading: apiLoading, totalPages, total, fetchCampaigns } = useCampaigns();

  // Template preview
  const { showPreview, previewTemplate, closePreview, openPreview } = useTemplatePreview();
  const [templateLoading, setTemplateLoading] = useState(false);

  // Recipient list modal
  const [showRecipientPopup, setShowRecipientPopup] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<GroupMember[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRecord | null>(null);

  // 1) Hydrate from URL once
  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    setSearchTerm(url.get('search') || '');
    setStatusFilter(url.get('status') || '');
    setCurrentPage(parseInt(url.get('page') || '1', 10));
    setSortField((url.get('sortField') as keyof CampaignRecord) || 'date');
    setSortDirection((url.get('sortDirection') as 'asc'|'desc') || 'desc');
    setHydrated(true);
  }, []);

  // 2) Reflect state back to URL (single writer)
  useEffect(() => {
    if (!hydrated) return;
    const url = new URLSearchParams();
    if (searchTerm) url.set('search', searchTerm);
    if (statusFilter) url.set('status', statusFilter);
    if (currentPage > 1) url.set('page', String(currentPage));
    if (sortField !== 'date') url.set('sortField', String(sortField));
    if (sortDirection !== 'desc') url.set('sortDirection', sortDirection);
    const newUrl = url.toString() ? `${window.location.pathname}?${url}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [hydrated, searchTerm, statusFilter, currentPage, sortField, sortDirection]);

  // 3) Fetch when hydrated and filters change (single fetch path)
  useEffect(() => {
    if (!hydrated) return;
    const params: CampaignFilterParams = {
      page: currentPage,
      limit: 10,
      ...(searchTerm ? { search: searchTerm } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      sortField,
      sortDirection
    };
    fetchCampaigns(params);
  }, [hydrated, currentPage, searchTerm, statusFilter, sortField, sortDirection, fetchCampaigns]);

  // Map API -> UI without extra setState
  const campaigns: CampaignRecord[] = useMemo(() => {
    return (apiCampaigns || []).map((c: Campaign) => ({
      id: c.id,
      campaignName: c.name,
      campaignId: c.campaignId,
      template: c.template ? {
        id: c.template.id,
        name: c.template.name,
        metaTemplateName: c.template.metaTemplateName,
        isMetaTemplate: c.template.isMetaTemplate,
        metaStatus: c.template.metaStatus
      } : { id: '', name: 'Unknown Template', metaTemplateName: undefined, isMetaTemplate: false, metaStatus: undefined },
      recipientList: c.recipientList ? { name: c.recipientList.name, recipientCount: c.recipientList.recipientCount } : null,
      date: new Date(c.createdAt).toISOString().split('T')[0],
      sendStatus: c.status as SendStatus,
      totalRecipients: c.progress?.total || 0,
      sentCount: c.progress?.sent || 0,
      failedCount: c.progress?.failed || 0,
      successRate: c.progress?.successRate || 0,
      status: c.status
    }));
  }, [apiCampaigns]);

  // Handlers: state-only; no URL writes here
  const handleSort = (field: keyof CampaignRecord) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page !== currentPage) setCurrentPage(page);
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
        openPreview({
          name: campaign.template.name,
          metaTemplateName: campaign.template.metaTemplateName,
          isMetaTemplate: campaign.template.isMetaTemplate,
          metaStatus: campaign.template.metaStatus
        } as Template);
        return;
      }
      const response = await templateApi.getById(templateId);
      openPreview((response.data ?? response) as Template);
    } catch {
      openPreview({
        name: campaign.template.name,
        metaTemplateName: campaign.template.metaTemplateName,
        isMetaTemplate: campaign.template.isMetaTemplate,
        metaStatus: campaign.template.metaStatus
      } as Template);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleRecipientListClick = useCallback(async (campaign: CampaignRecord) => {
    try {
      setSelectedCampaign(campaign);
      const campaignData = await campaignsAPI.getCampaignById(campaign.id);
      const recs = (campaignData?.data?.recipients ?? campaignData?.recipients ?? []) as any[];
      const groupMembers: GroupMember[] = recs.map((r) => ({
        id: r.id, mrId: r.mrId, firstName: r.firstName, lastName: r.lastName,
        name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Unknown',
        phone: r.phone || 'N/A', email: r.email || '', group: r.group || 'Default Group',
        status: r.status || 'pending', sentAt: r.sentAt, errorMessage: r.errorMessage,
        errorCode: r.errorCode, errorTitle: r.errorTitle, errorDetails: r.errorDetails, messageId: r.messageId
      }));
      setSelectedRecipients(groupMembers);
      setShowRecipientPopup(true);
    } catch {
      setSelectedRecipients([]);
      setShowRecipientPopup(true);
    }
  }, []);

  // URL-triggered modal open
  useEffect(() => {
    if (!hydrated) return;
    const show = searchParams.get('showRecipientList');
    const id = searchParams.get('campaignId');
    if (show === 'true' && id && campaigns.length > 0) {
      const c = campaigns.find(x => x.id === id || x.campaignId === id);
      if (c) {
        handleRecipientListClick(c);
        setSearchParams(new URLSearchParams());
      }
    }
  }, [hydrated, searchParams, campaigns, setSearchParams, handleRecipientListClick]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <StandardHeader pageTitle="Dashboard" />
        <CampaignStats campaigns={campaigns} loading={apiLoading} />
        <AdvancedCampaignSearch
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={(term) => { if (term !== searchTerm) { setSearchTerm(term); setCurrentPage(1); } }}
          onStatusChange={(status) => { if (status !== statusFilter) { setStatusFilter(status); setCurrentPage(1); } }}
          onClearFilters={clearFilters}
          filteredCount={total || 0}
          totalCount={overallTotal}
        />
        <CampaignTable
          campaigns={campaigns}
          onRecipientListClick={handleRecipientListClick}
          onTemplatePreview={handleTemplatePreview}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          loading={apiLoading || templateLoading}
          templateLoading={templateLoading}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          statusFilter={statusFilter}
          searchTerm={searchTerm}
          filteredTotal={total}
        />
        <TemplatePreviewManager
          isOpen={showPreview}
          template={previewTemplate}
          onClose={closePreview}
          variant="full"
          showDownloadButton
          showBulkUploadButton
        />
        <RecipientListModal
          isOpen={showRecipientPopup}
          onClose={() => { setShowRecipientPopup(false); setSelectedCampaign(null); }}
          recipients={selectedRecipients}
          campaignName={selectedCampaign?.campaignName || 'Campaign Recipients'}
          campaignId={selectedCampaign?.id}
          showExportButton
        />
      </div>
    </div>
  );
};

export default Dashboard;
