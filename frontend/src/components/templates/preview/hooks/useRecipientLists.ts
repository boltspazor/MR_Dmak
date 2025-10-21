import { useState, useEffect, useRef } from 'react';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';

type RecipientList = any;

export const useRecipientLists = (
  templateId: string | undefined,
  shouldFetch: boolean
) => {
  const [recipientLists, setRecipientLists] = useState<RecipientList[]>([]);
  const [selectedRecipientList, setSelectedRecipientList] = useState<RecipientList | null>(null);
  const [loadingRecipientLists, setLoadingRecipientLists] = useState(false);

  // Cache fetch status per template to avoid re-fetching
  const fetchedForTemplate = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const loadRecipientLists = async () => {
      if (!templateId || !shouldFetch) return;

      // Skip if fetched once for this templateId
      if (fetchedForTemplate.current[templateId]) return;

      try {
        setLoadingRecipientLists(true);
        const response = await api.get(`/recipient-lists/template/${templateId}`);
        const listsData = response.data?.data || response.data || [];
        setRecipientLists(listsData);
        setSelectedRecipientList(listsData[0] || null);
        fetchedForTemplate.current[templateId] = true;
      } catch (error) {
        console.error('Failed to load recipient lists:', error);
        toast.error('Failed to load recipient lists');
        setRecipientLists([]);
        setSelectedRecipientList(null);
      } finally {
        setLoadingRecipientLists(false);
      }
    };

    loadRecipientLists();
  }, [templateId, shouldFetch]);

  // Optional: reset when templateId changes (but keep cache)
  useEffect(() => {
    setRecipientLists([]);
    setSelectedRecipientList(null);
  }, [templateId]);

  return {
    recipientLists,
    selectedRecipientList,
    setSelectedRecipientList,
    loadingRecipientLists,
    // Expose a manual reset if needed
    reset: () => {
      setRecipientLists([]);
      setSelectedRecipientList(null);
      if (templateId) fetchedForTemplate.current[templateId] = false;
    }
  };
};
