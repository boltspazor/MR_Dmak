import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { TemplateRecipients } from '../types';

export const useTemplateRecipients = (templateId?: string) => {
  const [recipients, setRecipients] = useState<TemplateRecipients[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipients = async (id?: string) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/recipient-lists/template/${id}`);
      setRecipients(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch recipients');
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  const uploadRecipients = async (
    templateId: string,
    name: string,
    description: string,
    csvFile: File
  ): Promise<{ success: boolean; error?: string; validationResults?: any }> => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('templateId', templateId);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('csvFile', csvFile);

      await api.post('/recipient-lists/template/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Refresh recipients list
      await fetchRecipients(templateId);

      return { success: true };
    } catch (err: any) {
      const errorData = err.response?.data;
      return {
        success: false,
        error: errorData?.error || 'Failed to upload recipients',
        validationResults: errorData?.validationResults
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipients = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await api.delete(`/recipient-lists/template/${id}`);
      
      // Refresh recipients list
      if (templateId) {
        await fetchRecipients(templateId);
      }

      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete recipients');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (templateId) {
      fetchRecipients(templateId);
    }
  }, [templateId]);

  return {
    recipients,
    loading,
    error,
    fetchRecipients,
    uploadRecipients,
    deleteRecipients
  };
};
