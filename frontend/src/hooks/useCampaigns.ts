import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Campaign, Template } from '../types';

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [mrs, setMrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [campaignsRes, templatesRes, mrsRes] = await Promise.all([
        api.get('/messages/campaigns').catch(err => {
          console.log('Campaigns not available (likely auth issue):', err.message);
          return { data: { data: [] } };
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
      setCampaigns(campaignsRes.data?.data || campaignsRes.data || []);
      setTemplates(templatesRes.data?.data || templatesRes.data || []);
      setMrs(mrsRes.data?.data || mrsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error to prevent undefined access
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
