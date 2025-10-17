import React from 'react';
import { X } from 'lucide-react';
import { Template } from '../../../types/index';
import WhatsAppMessagePreview from './WhatsAppMessagePreview';
import TemplateParametersList from './TemplateParametersList';
import { extractParameters, processContent } from '../../../utils/templateUtils';

interface TemplatePreviewCompactProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  variant?: 'full' | 'compact' | 'panel';
}

const TemplatePreviewCompact: React.FC<TemplatePreviewCompactProps> = ({
  isOpen,
  onClose,
  template
}) => {
  if (!isOpen || !template) return null;

  const extractedParams = extractParameters(template);
  const processedContent = processContent(template.content);

  // Debug log to check if component is rendering
  console.log('TemplatePreviewCompact rendering:', { isOpen, templateName: template.name });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Template Preview: {template.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* WhatsApp Preview - Full Width */}
          <div className="max-w-lg mx-auto">
            <WhatsAppMessagePreview
              template={template}
              processedContent={processedContent}
              imageHeight="h-48"
            />
          </div>

          {/* Template Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            {/* Template Type */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Template Type</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {template.type || 'text'}
              </span>
            </div>

            {/* Created Date */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Created</h4>
              <span className="text-sm text-gray-600">
                {new Date(template.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Content Length */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Content Length</h4>
              <span className="text-sm text-gray-600">
                {template.content.length} characters
              </span>
            </div>

            {/* Parameters Count */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Parameters</h4>
              <span className="text-sm text-gray-600">
                {extractedParams.length} parameter{extractedParams.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Parameters Section */}
          {extractedParams.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Template Parameters</h4>
              <TemplateParametersList parameters={extractedParams} />
            </div>
          )}

          {/* Image URL Display (Read-only) */}
          {template.imageUrl && template.imageUrl.trim() !== '' && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Image URL</h4>
              <p className="text-sm text-gray-600 break-all bg-gray-50 p-3 rounded-lg">
                {template.imageUrl}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewCompact;
