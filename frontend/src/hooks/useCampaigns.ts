// hooks/useCampaigns.ts
import { useCallback, useRef, useState } from 'react';
import { campaignsAPI, Campaign } from '../api/campaigns-new';
import { CampaignFilterParams } from '../types/campaign.types';

type Pagination = { page: number; totalPages: number; total: number; allTotal: number };

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const [allTotal, setAllTotal] = useState(0);
  const reqKeyRef = useRef<string>('');

  const fetchCampaigns = useCallback(async (params: CampaignFilterParams) => {
    if (!params?.page || !params?.limit) return;
    // generate stable request key
    const key = JSON.stringify({
      page: params.page,
      limit: params.limit,
      search: params.search || '',
      status: params.status || '',
      sortField: params.sortField || '',
      sortDirection: params.sortDirection || ''
    });
    reqKeyRef.current = key;

    // abort previous
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await campaignsAPI.getCampaigns(params, { signal: controller.signal });
      // Accept both axios and fetch-like shapes
      const body = res;
      const items: Campaign[] = body?.campaigns ?? [];
      const pagination: Pagination = body?.pagination ?? { page: params.page, totalPages: 1, total: 0 };

      // drop stale responses
      if (reqKeyRef.current !== key) return;

      setCampaigns(items);
      setTotalPages(pagination.totalPages || 1);
      setTotal(pagination.total || items.length || 0);
      // If backend provides an explicit allTotal use it, otherwise request lightweight total-count endpoint
      const inferredAllTotal = pagination.allTotal || pagination.total || items.length || 0;
      setAllTotal(inferredAllTotal);

      // Try to fetch the true unfiltered total from the lightweight endpoint. Do this after setting current page state
      // so we don't block the main request; failures are non-fatal.
      try {
        const totalRes = await campaignsAPI.getCampaignTotalCount();
        if (totalRes && typeof totalRes.total === 'number') {
          setAllTotal(totalRes.total);
        }
      } catch (err) {
        // ignore - keep inferredAllTotal
        // console.debug('Failed to fetch campaign total-count:', err);
      }
    } catch (e: any) {
      if (e?.name !== 'CanceledError' && e?.name !== 'AbortError') {
        setCampaigns([]);
        setTotal(0);
        setTotalPages(1);
        setAllTotal(0);
      }
    } finally {
      if (reqKeyRef.current === key) setLoading(false);
    }
  }, []);

  return { campaigns, loading, totalPages, total, allTotal, fetchCampaigns };
};
