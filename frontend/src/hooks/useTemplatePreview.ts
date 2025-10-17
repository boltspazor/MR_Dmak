import { useState } from 'react';
import { Template } from '../types';
import { useTemplateRecipients } from './useTemplateRecipients';
import { extractTemplateParameters, escapeCSV } from '../utils/csvValidation';

export interface UseTemplatePreviewReturn {
  // State
  showPreview: boolean;
  previewTemplate: Template | null;
  showRecipientUpload: boolean;
  uploadTemplate: Template | null;
  
  // Recipient data
  previewRecipients: any[];
  
  // Actions
  openPreview: (template: Template) => void;
  closePreview: () => void;
  openRecipientUpload: (template: Template) => void;
  closeRecipientUpload: () => void;
  downloadRecipientListFormat: (template: Template) => void;
  refreshRecipients: () => void;
}

export const useTemplatePreview = (): UseTemplatePreviewReturn => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showRecipientUpload, setShowRecipientUpload] = useState(false);
  const [uploadTemplate, setUploadTemplate] = useState<Template | null>(null);

  // Fetch recipients for the preview template
  const { recipients: previewRecipients, fetchRecipients: fetchPreviewRecipients } = 
    useTemplateRecipients(previewTemplate?._id);

  const openPreview = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    // Don't clear previewTemplate immediately to avoid flash during close animation
    setTimeout(() => setPreviewTemplate(null), 300);
  };

  const openRecipientUpload = (template: Template) => {
    setUploadTemplate(template);
    setShowRecipientUpload(true);
  };

  const closeRecipientUpload = () => {
    setShowRecipientUpload(false);
    setTimeout(() => setUploadTemplate(null), 300);
  };

  const downloadRecipientListFormat = (template: Template) => {
    const parameters = extractTemplateParameters(template.content);
    const csvRows = [];

    // Row 1: Template name
    const row1 = [template.name, ...Array(Math.max(parameters.length + 2, 10)).fill('')];
    csvRows.push(row1.map(escapeCSV).join(','));

    // Row 2: Column headers
    const row2 = ['mrId', 'firstName', 'lastName', ...parameters];
    csvRows.push(row2.map(escapeCSV).join(','));

    const csvContent = csvRows.join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '_')}_recipient_list_format.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const refreshRecipients = () => {
    if (previewTemplate?._id) {
      fetchPreviewRecipients(previewTemplate._id);
    }
  };

  return {
    showPreview,
    previewTemplate,
    showRecipientUpload,
    uploadTemplate,
    previewRecipients,
    openPreview,
    closePreview,
    openRecipientUpload,
    closeRecipientUpload,
    downloadRecipientListFormat,
    refreshRecipients,
  };
};
