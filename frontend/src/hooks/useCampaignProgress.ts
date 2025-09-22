import { useState, useEffect, useCallback, useRef } from 'react';
import { campaignProgressAPI, CampaignProgress, CampaignSummary } from '../api/campaign-progress';
import toast from 'react-hot-toast';

interface UseCampaignProgressOptions {
  campaignId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onProgressUpdate?: (progress: CampaignProgress) => void;
}

interface UseCampaignProgressReturn {
  progress: CampaignProgress | null;
  campaigns: CampaignSummary[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refreshProgress: () => Promise<void>;
  refreshCampaigns: () => Promise<void>;
  getCampaignProgress: (campaignId: string) => Promise<CampaignProgress>;
}

export const useCampaignProgress = (options: UseCampaignProgressOptions = {}): UseCampaignProgressReturn => {
  const {
    campaignId,
    autoRefresh = true,
    refreshInterval = 5000,
    onProgressUpdate
  } = options;

  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const refreshProgress = useCallback(async (showRefreshing = true) => {
    if (!campaignId) return;

    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      const data = await campaignProgressAPI.getCampaignProgress(campaignId);
      
      if (isMountedRef.current) {
        setProgress(data);
        onProgressUpdate?.(data);
      }
    } catch (err: any) {
      console.error('Error fetching campaign progress:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch campaign progress';
      
      if (isMountedRef.current) {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [campaignId, onProgressUpdate]);

  const refreshCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await campaignProgressAPI.getAllCampaignsProgress();
      
      if (isMountedRef.current) {
        setCampaigns(data.campaigns);
      }
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch campaigns';
      
      if (isMountedRef.current) {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const getCampaignProgress = useCallback(async (id: string): Promise<CampaignProgress> => {
    try {
      const data = await campaignProgressAPI.getCampaignProgress(id);
      return data;
    } catch (err: any) {
      console.error('Error fetching campaign progress:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch campaign progress');
    }
  }, []);

  // Auto-refresh effect for specific campaign
  useEffect(() => {
    if (campaignId) {
      refreshProgress(false);
      
      if (autoRefresh) {
        intervalRef.current = setInterval(() => {
          refreshProgress(true);
        }, refreshInterval);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [campaignId, autoRefresh, refreshInterval, refreshProgress]);

  // Load campaigns on mount
  useEffect(() => {
    refreshCampaigns();
  }, [refreshCampaigns]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    progress,
    campaigns,
    loading,
    refreshing,
    error,
    refreshProgress: () => refreshProgress(true),
    refreshCampaigns,
    getCampaignProgress
  };
};
