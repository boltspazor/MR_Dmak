import { useState, useCallback } from 'react';
import { campaignsAPI, Campaign } from '../api/campaigns-new';
import { CampaignFilterParams } from '../types/campaign.types';

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // you can make this configurable
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async (params: CampaignFilterParams = {}) => {
    try {
      setLoading(true);
      
      const requestParams: any = {
        page: params.page || page,
        limit: params.limit || limit
      };
      
      // Only add search/status if they have actual values (not empty strings)
      if (params.search && params.search.trim() !== '') {
        requestParams.search = params.search.trim();
      }
      if (params.status && params.status.trim() !== '' && params.status !== 'all') {
        requestParams.status = params.status.trim();
      }
      if (params.sortField) {
        requestParams.sortField = params.sortField;
      }
      if (params.sortDirection) {
        requestParams.sortDirection = params.sortDirection;
      }

            console.log('🔍 useCampaigns - Fetching campaigns with params:', requestParams);
      console.log('🔍 Search term:', params.search, 'Type:', typeof params.search);
      console.log('🔍 Status filter:', params.status, 'Type:', typeof params.status);
      console.log('🔍 Full original params:', params);
      console.log('🔍 Search term:', params.search, 'Type:', typeof params.search);
      console.log('🔍 Status filter:', params.status, 'Type:', typeof params.status);
      console.log('🔍 Full original params:', params);
      
      const campaignsRes = await campaignsAPI.getCampaigns(requestParams).catch(err => {
        console.log('Campaigns not available (likely auth issue):', err.message);
        return { data: { campaigns: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } } } as any;
      });

      console.log('🔍 useCampaigns - API response:', campaignsRes);
      
      const campaigns = (campaignsRes.data?.data?.campaigns || campaignsRes.campaigns || []) as Campaign[];
      const pagination = (campaignsRes.data?.data?.pagination || campaignsRes.pagination || { page: 1, totalPages: 1, total: 0 });

      console.log('🔍 useCampaigns - Extracted campaigns count:', campaigns.length);
      console.log('🔍 useCampaigns - Campaign statuses:', campaigns.map(c => ({ name: c.name, status: c.status })));
      console.log('🔍 useCampaigns - Pagination:', pagination);

      setCampaigns(campaigns);
      setTotalPages(pagination.totalPages);
      setTotal(pagination.total);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  // Note: fetchData is called from Dashboard component with full parameters

  return {
    campaigns,
    loading,
    page,
    setPage,
    totalPages,
    total,
    fetchCampaigns: fetchData,
    refetch: () => fetchData({ page })
  };
};
