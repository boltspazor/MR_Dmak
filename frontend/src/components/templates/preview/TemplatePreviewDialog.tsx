import React from 'react';
import { Template } from '../../../types/index';
import TemplatePreviewFull from './TemplatePreviewFull';
import TemplatePreviewCompact from './TemplatePreviewCompact';
import TemplatePreviewPanel from './TemplatePreviewPanel';

interface TemplatePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  onDownloadRecipientList?: (template: Template) => void;
  onBulkUploadRecipients?: (template: Template) => void;
  showDownloadButton?: boolean;
  showBulkUploadButton?: boolean;
  variant?: 'full' | 'compact' | 'panel';
  onUpdateTemplate?: (templateId: string, updates: Partial<Template>) => Promise<void>;
}

const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = (props) => {
  const { isOpen, template, variant = 'full' } = props;

  if (!isOpen || !template) return null;

  // Validate template
  if (!template.name || !template.content) {
    console.error('Template missing required properties:', template);
    return null;
  }

  // Route to appropriate variant
  switch (variant) {
    case 'compact':
      return <TemplatePreviewCompact {...props} />;
    case 'panel':
      return <TemplatePreviewPanel {...props} />;
    case 'full':
    default:
      return <TemplatePreviewFull {...props} />;
  }
};

export default TemplatePreviewDialog;
