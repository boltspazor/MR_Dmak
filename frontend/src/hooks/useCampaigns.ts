import { useState, useEffect } from 'react';
import { campaignsAPI, Campaign } from '../api/campaigns-new';
import { api } from '../lib/api';
import { Template } from '../types';

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [mrs, setMrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchData = async () => {
    try {
      const [campaignsRes, templatesRes, mrsRes] = await Promise.all([
        campaignsAPI.getCampaigns().catch(err => {
          console.log('Campaigns not available (likely auth issue):', err.message);
          return { campaigns: [] };
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

      // Handle different response structures safely
      const campaigns = campaignsRes.campaigns || [];
      const templates = templatesRes.data?.data || templatesRes.data || [];
      const mrs = mrsRes.data?.data || mrsRes.data || [];

      setCampaigns(campaigns);
      setTemplates(templates);
      setMrs(mrs);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error
      setCampaigns([]);
      setTemplates([]);
      setMrs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    campaigns,
    templates,
    mrs,
    loading,
    refetch: fetchData
  };
};
