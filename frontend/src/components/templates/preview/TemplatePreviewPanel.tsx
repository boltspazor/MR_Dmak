import React from 'react';
import { Template } from '../../../types/index';
import WhatsAppMessagePreview from './WhatsAppMessagePreview';
import TemplateParametersList from './TemplateParametersList';
import { extractParameters, processContent } from '../../../utils/templateUtils';

interface TemplatePreviewPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  template: Template;
  variant?: 'full' | 'compact' | 'panel';
}

const TemplatePreviewPanel: React.FC<TemplatePreviewPanelProps> = ({
  template
}) => {
  if (!template) return null;

  const extractedParams = extractParameters(template);
  const processedContent = processContent(template.content);

  return (
    <div className="space-y-6">
      {/* WhatsApp Preview */}
      <div>
        <WhatsAppMessagePreview
          template={template}
          processedContent={processedContent}
          imageHeight="h-64"
        />
      </div>

      {/* Template Details Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Template Details</h3>
        
        <div className="space-y-3">
          {/* Template Name */}
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Name:</span>
            <span className="text-sm font-medium text-gray-900">{template.name}</span>
          </div>

          {/* Template Type */}
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Type:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {template.type || 'text'}
            </span>
          </div>

          {/* Created Date */}
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Created:</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(template.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Content Length */}
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Content Length:</span>
            <span className="text-sm font-medium text-gray-900">
              {template.content.length} characters
            </span>
          </div>

          {/* Parameters Count */}
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Parameters:</span>
            <span className="text-sm font-medium text-gray-900">
              {extractedParams.length}
            </span>
          </div>

          {/* Image URL (if exists) */}
          {template.imageUrl && template.imageUrl.trim() !== '' && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Image URL:</span>
              </div>
              <p className="text-xs text-gray-600 break-all bg-gray-50 p-2 rounded">
                {template.imageUrl}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Parameters Section */}
      {extractedParams.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Template Parameters</h3>
          <TemplateParametersList parameters={extractedParams} />
        </div>
      )}

      {/* Meta Category Badge (if Meta template) */}
      {template.isMetaTemplate && template.metaCategory && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Meta Template</p>
              <p className="text-xs text-blue-700">Category: {template.metaCategory}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePreviewPanel;
