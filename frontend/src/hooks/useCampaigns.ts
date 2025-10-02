import { useState, useEffect } from 'react';
import { campaignsAPI, Campaign } from '../api/campaigns-new';

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // you can make this configurable
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async (pageParam = page) => {
    try {
      const campaignsRes = await campaignsAPI.getCampaigns({ page: pageParam, limit }).catch(err => {
        console.log('Campaigns not available (likely auth issue):', err.message);
        return { data: { campaigns: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } } } as any;
      });

      const campaigns = (campaignsRes.data?.data?.campaigns || campaignsRes.campaigns || []) as Campaign[];
      const pagination = (campaignsRes.data?.data?.pagination || campaignsRes.pagination || { page: 1, totalPages: 1, total: 0 });

      setCampaigns(campaigns);
      setTotalPages(pagination.totalPages);
      setTotal(pagination.total);
    } catch (error) {
      console.error('Error fetching data:', error);
      setCampaigns([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  return {
    campaigns,
    loading,
    page,
    setPage,
    totalPages,
    total,
    refetch: () => fetchData(page)
  };
};
