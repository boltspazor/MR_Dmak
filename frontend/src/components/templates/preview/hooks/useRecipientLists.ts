import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';

export const useRecipientLists = (templateId: string, isOpen: boolean) => {
  const [recipientLists, setRecipientLists] = useState<any[]>([]);
  const [selectedRecipientList, setSelectedRecipientList] = useState<any>(null);
  const [loadingRecipientLists, setLoadingRecipientLists] = useState(false);

  useEffect(() => {
    const loadRecipientLists = async () => {
      if (templateId && isOpen) {
        try {
          setLoadingRecipientLists(true);
          const response = await api.get(`/recipient-lists/template/${templateId}`);
          const listsData = response.data.data || response.data || [];
          setRecipientLists(listsData);

          if (listsData.length > 0) {
            setSelectedRecipientList(listsData[0]);
          } else {
            setSelectedRecipientList(null);
          }
        } catch (error: any) {
          console.error('Failed to load recipient lists:', error);
          toast.error('Failed to load recipient lists');
          setRecipientLists([]);
          setSelectedRecipientList(null);
        } finally {
          setLoadingRecipientLists(false);
        }
      } else {
        setRecipientLists([]);
        setSelectedRecipientList(null);
      }
    };

    loadRecipientLists();
  }, [templateId, isOpen]);

  return {
    recipientLists,
    selectedRecipientList,
    setSelectedRecipientList,
    loadingRecipientLists
  };
};
