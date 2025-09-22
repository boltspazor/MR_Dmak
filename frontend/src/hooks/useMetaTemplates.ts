import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export interface MetaTemplateStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface UseMetaTemplatesReturn {
  metaTemplateStats: MetaTemplateStats | null;
  syncingTemplates: boolean;
  loadMetaTemplateStats: () => Promise<void>;
  syncTemplatesWithMeta: () => Promise<void>;
  getMetaTemplateCreationUrl: () => Promise<void>;
}

export const useMetaTemplates = (): UseMetaTemplatesReturn => {
  const [metaTemplateStats, setMetaTemplateStats] = useState<MetaTemplateStats | null>(null);
  const [syncingTemplates, setSyncingTemplates] = useState(false);

  const loadMetaTemplateStats = useCallback(async () => {
    try {
      const response = await api.get('/meta-templates/status-summary');
      setMetaTemplateStats(response.data.data);
    } catch (error) {
      console.error('Failed to load Meta template stats:', error);
    }
  }, []);

  const syncTemplatesWithMeta = useCallback(async () => {
    try {
      setSyncingTemplates(true);
      const response = await api.post('/meta-templates/sync');
      await loadMetaTemplateStats();
      return response.data;
    } catch (error: any) {
      console.error('Failed to sync templates:', error);
      throw error;
    } finally {
      setSyncingTemplates(false);
    }
  }, [loadMetaTemplateStats]);

  const getMetaTemplateCreationUrl = useCallback(async () => {
    try {
      const response = await api.get('/meta-templates/meta-urls/creation');
      const url = response.data.data.url;
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Failed to get Meta template creation URL:', error);
      throw error;
    }
  }, []);

  return {
    metaTemplateStats,
    syncingTemplates,
    loadMetaTemplateStats,
    syncTemplatesWithMeta,
    getMetaTemplateCreationUrl
  };
};
