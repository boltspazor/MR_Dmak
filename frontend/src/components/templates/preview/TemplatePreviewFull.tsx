import React from 'react';
import { X, Download, Upload } from 'lucide-react';
import { Template } from '../../../types/index';
import WhatsAppMessagePreview from './WhatsAppMessagePreview';
import TemplateParametersList from './TemplateParametersList';
import ImageEditor from './ImageEditor';
import RecipientListsSection from './RecipientListsSection';
import { extractParameters, processContent } from '../../../utils/templateUtils';

interface TemplatePreviewFullProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  onDownloadRecipientList?: (template: Template) => void;
  onBulkUploadRecipients?: (template: Template) => void;
  showDownloadButton?: boolean;
  showBulkUploadButton?: boolean;
  onUpdateTemplate?: (templateId: string, updates: Partial<Template>) => Promise<void>;
}

const TemplatePreviewFull: React.FC<TemplatePreviewFullProps> = ({
  isOpen,
  onClose,
  template,
  onDownloadRecipientList,
  onBulkUploadRecipients,
  showDownloadButton = true,
  showBulkUploadButton = true,
  onUpdateTemplate
}) => {
  const extractedParams = extractParameters(template);
  const processedContent = processContent(template.content);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Template Preview</h2>
              <p className="text-sm text-gray-600 mt-1">
                {template.name} • Created {new Date(template.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Content Length: {template.content.length} characters • Parameters: {extractedParams.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - WhatsApp Preview */}
            <div className="space-y-6">
              <WhatsAppMessagePreview
                template={template}
                processedContent={processedContent}
                imageHeight="h-64"
              />
            </div>

            {/* Right Side - Details & Actions */}
            <div className="space-y-6">
              {/* Template Actions */}
              {((showDownloadButton && onDownloadRecipientList) || (showBulkUploadButton && onBulkUploadRecipients)) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Template Actions</h4>
                  <div className="flex gap-3">
                    {showDownloadButton && onDownloadRecipientList && (
                      <button
                        onClick={() => onDownloadRecipientList(template)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download Template CSV
                      </button>
                    )}
                    {showBulkUploadButton && onBulkUploadRecipients && (
                      <button
                        onClick={() => onBulkUploadRecipients(template)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Recipients
                      </button>
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">
                      <strong>CSV Format:</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      • Row 1: Template Name in A1, template name in B1<br />
                      • Row 2: MR ID, First Name, Last Name{extractedParams.length > 0 ? `, ${extractedParams.map(p => p.name).join(', ')}` : ''}<br />
                      • Each parameter will have its own column in the recipient list
                    </p>
                  </div>
                </div>
              )}

              {/* Extracted Parameters */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Extracted Parameters</h4>
                <TemplateParametersList parameters={extractedParams} />
              </div>

              {/* Template Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Template Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm font-medium text-gray-900">{template.type || 'text'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Content Length:</span>
                    <span className="text-sm font-medium text-gray-900">{template.content.length} characters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Parameters:</span>
                    <span className="text-sm font-medium text-gray-900">{extractedParams.length}</span>
                  </div>

                  <ImageEditor template={template} onUpdateTemplate={onUpdateTemplate} />
                </div>
              </div>

              {/* Recipient Lists */}
              <RecipientListsSection template={template} isOpen={isOpen} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewFull;
