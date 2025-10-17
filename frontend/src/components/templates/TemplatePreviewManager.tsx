import React, { useState, useEffect } from 'react';
import { Template } from '../../types';
import { useConfirm } from '../../contexts/ConfirmContext';
import TemplatePreviewDialog from './preview/TemplatePreviewDialog';
import TemplateRecipientUploadV2 from '../ui/TemplateRecipientUploadV2';
import { useTemplatePreview } from '../../hooks/useTemplatePreview';
import { templateApi } from '../../api/templates';

interface TemplatePreviewManagerProps {
  // External control (optional)
  isOpen?: boolean;
  template?: Template | null;
  onClose?: () => void;
  
  // Variant configuration
  variant?: 'full' | 'compact' | 'panel';
  
  // Feature toggles
  showDownloadButton?: boolean;
  showBulkUploadButton?: boolean;
  
  // Callbacks
  onUpdateTemplate?: (templateId: string, updates: Partial<Template>) => Promise<void>;
  onUploadSuccess?: () => void;
}

const TemplatePreviewManager: React.FC<TemplatePreviewManagerProps> = ({
  isOpen: controlledIsOpen,
  template: controlledTemplate,
  onClose: controlledOnClose,
  variant = 'full',
  showDownloadButton = true,
  showBulkUploadButton = true,
  onUpdateTemplate,
  onUploadSuccess,
}) => {
  const { alert } = useConfirm();
  
  const {
    showPreview,
    previewTemplate,
    showRecipientUpload,
    uploadTemplate,
    previewRecipients,
    closePreview,
    openRecipientUpload,
    closeRecipientUpload,
    downloadRecipientListFormat,
    refreshRecipients,
  } = useTemplatePreview();

  // Local state for refreshed template
  const [refreshedTemplate, setRefreshedTemplate] = useState<Template | null>(null);

  // Use controlled props if provided, otherwise use internal state
  const isPreviewOpen = controlledIsOpen !== undefined ? controlledIsOpen : showPreview;
  const baseTemplate = controlledTemplate !== undefined ? controlledTemplate : previewTemplate;
  
  // Use refreshed template if available, otherwise use base template
  const currentTemplate = refreshedTemplate || baseTemplate;
  
  const handleClosePreview = controlledOnClose || closePreview;

  // Refresh template when it changes or when controlled template changes
  useEffect(() => {
    if (baseTemplate?._id) {
      fetchLatestTemplate(baseTemplate._id);
    }
  }, [baseTemplate?._id]);

  const fetchLatestTemplate = async (templateId: string) => {
    try {
      const response = await templateApi.getById(templateId);
      setRefreshedTemplate(response.data as Template);
    } catch (error) {
      console.error('Failed to fetch latest template:', error);
      // Fallback to base template if fetch fails
      setRefreshedTemplate(null);
    }
  };

  const handleBulkUploadRecipients = (template: Template) => {
    openRecipientUpload(template);
  };

  const handleUploadSuccess = () => {
    // Refresh recipients if viewing the same template
    if (currentTemplate?._id === uploadTemplate?._id) {
      refreshRecipients();
    }
    
    // Call external callback if provided
    onUploadSuccess?.();
  };

  // Wrapper for onUpdateTemplate that refreshes the template after update
  const handleUpdateTemplate = async (templateId: string, updates: Partial<Template>) => {
    if (onUpdateTemplate) {
      await onUpdateTemplate(templateId, updates);
    }
    
    // Refresh the template to get latest data
    await fetchLatestTemplate(templateId);
  };

  return (
    <>
      {/* Template Preview Modal */}
      <TemplatePreviewDialog
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        template={{
          ...currentTemplate,
          recipientLists: previewRecipients
        } as Template}
        onDownloadRecipientList={downloadRecipientListFormat}
        onBulkUploadRecipients={handleBulkUploadRecipients}
        showDownloadButton={showDownloadButton}
        showBulkUploadButton={showBulkUploadButton}
        variant={variant}
        onUpdateTemplate={handleUpdateTemplate}
      />

      {/* Recipient Upload Modal */}
      {showRecipientUpload && uploadTemplate && (
        <TemplateRecipientUploadV2
          template={uploadTemplate}
          showError={(_title: string, message: string, isError?: boolean) => {
            alert(message, isError ? 'error' : 'info');
          }}
          onUploadSuccess={handleUploadSuccess}
          onClose={closeRecipientUpload}
        />
      )}
    </>
  );
};

export default TemplatePreviewManager;

// Re-export hook for convenience
export { useTemplatePreview } from '../../hooks/useTemplatePreview';
