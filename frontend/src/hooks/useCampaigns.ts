import { useState, useEffect } from 'react';
import { campaignsAPI, Campaign } from '../api/campaigns-new';
import { api } from '../lib/api';
import { Template } from '../types';

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [mrs, setMrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // you can make this configurable
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async (pageParam = page) => {
    try {
      const [campaignsRes, templatesRes, mrsRes] = await Promise.all([
        campaignsAPI.getCampaigns({ page: pageParam, limit }).catch(err => {
          console.log('Campaigns not available (likely auth issue):', err.message);
          return { data: { campaigns: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } } } as any;
        }),
        api.get('/meta-templates/all').catch(err => {
          console.log('Templates not available (likely auth issue):', err.message);
          return { data: { data: [] } };
        }),
        api.get('/mrs').catch(err => {
          console.log('MRs not available (likely auth issue):', err.message);
          return { data: { data: [] } };
        })
      ]);

      // Campaigns
      const campaigns = (campaignsRes.data?.data?.campaigns || campaignsRes.campaigns || []) as Campaign[];
      const pagination = (campaignsRes.data?.data?.pagination || campaignsRes.pagination || { page: 1, totalPages: 1, total: 0 });

      console.log({campaigns})

      setCampaigns(campaigns);
      setTotalPages(pagination.totalPages);
      setTotal(pagination.total);

      // Templates
      const templates = templatesRes.data?.data || templatesRes.data || [];
      setTemplates(templates);

      // MRs
      const mrs = mrsRes.data?.data || mrsRes.data || [];
      setMrs(mrs);
    } catch (error) {
      console.error('Error fetching data:', error);
      setCampaigns([]);
      setTemplates([]);
      setMrs([]);
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
    templates,
    mrs,
    loading,
    page,
    setPage,       // expose setter for UI
    totalPages,
    total,
    refetch: () => fetchData(page)
  };
};
