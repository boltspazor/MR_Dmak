import React from 'react';
import { X, FileText, Download, Upload } from 'lucide-react';
import { Template } from '../../types';

interface TemplatePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  onDownloadRecipientList?: (template: Template) => void;
  onBulkUploadRecipients?: (template: Template) => void;
  showDownloadButton?: boolean;
  showBulkUploadButton?: boolean;
  variant?: 'full' | 'compact'; // full: Templates page style, compact: Campaigns/Dashboard style
}

const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({
  isOpen,
  onClose,
  template,
  onDownloadRecipientList,
  onBulkUploadRecipients,
  showDownloadButton = true,
  showBulkUploadButton = true,
  variant = 'full'
}) => {
  if (!isOpen || !template) return null;

  try {
    // Ensure template has required properties
    if (!template.name || !template.content) {
      console.error('Template missing required properties:', template);
      return null;
    }

  // Extract parameters from content
  const extractParameters = (content: string): string[] => {
    const paramRegex = /\{\{([A-Za-z0-9_]+)\}\}/g;
    const matches = content.match(paramRegex);
    return matches ? [...new Set(matches.map(match => match.replace(/\{\{|\}\}/g, '')))] : [];
  };

  const extractedParams = template.parameters || extractParameters(template.content || '');

  // Sample parameter values for preview
  const sampleParams = {
    'FirstName': 'John',
    'LastName': 'Doe',
    'MRId': 'MR001',
    'GroupName': 'North Zone',
    'PhoneNumber': '+919876543210',
    'Name': 'John Doe',
    'Company': 'D-MAK',
    'Product': 'New Product',
    'ProductName': 'New Product',
    'Date': new Date().toLocaleDateString(),
    'Time': new Date().toLocaleTimeString(),
    'Month': new Date().toLocaleDateString('en-US', { month: 'long' }),
    'Year': new Date().getFullYear().toString(),
    'Target': '100',
    'Achievement': '85',
    'Location': 'Mumbai',
    'City': 'Mumbai',
    'State': 'Maharashtra',
    'Country': 'India',
    'FN': 'John',
    'LN': 'Doe',
    'week': 'Week 2',
    'lastmonth': '50 lakhs',
    'doctor': '30'
  };

  // Process content with sample values
  const processContent = (content: string): string => {
    try {
      let processedContent = content || '';
      
      // Replace parameters with sample values
      for (const [param, value] of Object.entries(sampleParams)) {
        const regex = new RegExp(`\\{\\{${param}\\}\\}`, 'g');
        processedContent = processedContent.replace(regex, value);
      }
      
      // Replace any remaining parameters with [Sample Value]
      processedContent = processedContent.replace(/\{\{[A-Za-z0-9_]+\}\}/g, '[Sample Value]');
      
      return processedContent;
    } catch (error) {
      console.error('Error processing content:', error);
      return content || '';
    }
  };

  const processedContent = processContent(template.content);

  if (variant === 'compact') {
    // Compact variant for Campaigns page
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Template Preview: {template.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Template Preview */}
            <div className="border-2 border-gray-200 rounded-lg p-6 bg-white max-w-lg mx-auto">
              <div className="space-y-4">
                {/* Header Image */}
                {template.imageUrl && (
                  <div className="text-left">
                    <img
                      src={template.imageUrl}
                      alt="Header"
                      className="max-w-full h-48 object-contain mx-auto rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show fallback message
                        const fallback = document.createElement('div');
                        fallback.className = 'bg-gray-100 h-48 flex items-center justify-center rounded text-gray-500';
                        fallback.innerHTML = '🖼️ Header Image Preview<br><small>Image will be rendered in actual message</small>';
                        target.parentNode?.insertBefore(fallback, target);
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {processedContent}
                  </pre>
                </div>

                {/* Footer Image */}
                {template.footerImageUrl && (
                  <div className="text-left">
                    <img
                      src={template.footerImageUrl}
                      alt="Footer"
                      className="max-w-full h-32 object-contain mx-auto rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show fallback message
                        const fallback = document.createElement('div');
                        fallback.className = 'bg-gray-100 h-32 flex items-center justify-center rounded text-gray-500';
                        fallback.innerHTML = '🖼️ Footer Image Preview<br><small>Image will be rendered in actual message</small>';
                        target.parentNode?.insertBefore(fallback, target);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Template Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Template Type:
                </h4>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {template.type || 'text'}
                </span>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Created:
                </h4>
                <span className="text-sm text-gray-600">
                  {new Date(template.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Parameters */}
            {extractedParams.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Parameters:
                </h4>
                <div className="flex flex-wrap gap-2">
                      {extractedParams.map((param: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {`{{${param}}}`}
                        </span>
                      ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full variant for Templates page (default)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Template Preview
              </h2>
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
            {/* Left Side - Template Content */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <h3 className="text-lg font-semibold text-gray-800">WhatsApp Message Preview</h3>
                </div>
                
                <div className="flex justify-center">
                  <div className="bg-white rounded-3xl rounded-tl-lg shadow-2xl max-w-sm w-full overflow-hidden">
                    {/* Header Image */}
                    {template.imageUrl && template.imageUrl.trim() !== '' ? (
                      <div className="w-full">
                        <img 
                          src={template.imageUrl} 
                          alt="Header"
                          className="w-full h-64 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-gray-500 text-sm">Header image failed to load</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No header image</span>
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div className="p-4">
                      <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {processedContent}
                      </div>
                    </div>
                    
                    {/* Footer Image */}
                    {template.footerImageUrl && template.footerImageUrl.trim() !== '' ? (
                      <div className="px-4 pb-4">
                        <img 
                          src={template.footerImageUrl} 
                          alt="Footer"
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-gray-500 text-xs">Footer image failed to load</span>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 pb-4">
                        <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No footer image</span>
                        </div>
                      </div>
                    )}
                    
                    {/* WhatsApp message time and status */}
                    <div className="px-4 pb-3">
                      <div className="flex justify-end items-center">
                        <span className="text-xs text-gray-500 mr-1">
                          {new Date().toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                        <span className="text-xs text-gray-500">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Parameters */}
            <div className="space-y-6">
              {/* Template Actions */}
              {(showDownloadButton && onDownloadRecipientList) || (showBulkUploadButton && onBulkUploadRecipients) ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Template Actions</h4>
                  <div className="flex gap-3">
                    {showDownloadButton && onDownloadRecipientList && (
                      <button
                        onClick={() => onDownloadRecipientList(template)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        title="Download Recipient List Template"
                      >
                        <Download className="h-4 w-4" />
                        Download Template CSV
                      </button>
                    )}
                    {showBulkUploadButton && onBulkUploadRecipients && (
                      <button
                        onClick={() => onBulkUploadRecipients(template)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Upload Recipients for this Template"
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
                      • Row 1: Template Name in A1, template name in B1<br/>
                      • Row 2: MR ID, First Name, Last Name{extractedParams.length > 0 ? `, ${extractedParams.join(', ')}` : ''}<br/>
                      • Each parameter will have its own column in the recipient list
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Extracted Parameters</h4>
                {extractedParams.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">
                      The following parameters were found in the template content:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {extractedParams.map((param, index) => (
                        <span 
                          key={index}
                          className="px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded-lg font-medium"
                        >
                          {`{{${param}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      No parameters found in this template
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Use {'{{'}ParameterName{'}}'} in your template content to create dynamic parameters
                    </p>
                  </div>
                )}
              </div>

              {/* Template Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Template Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {template.type || 'text'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Content Length:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {template.content.length} characters
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Parameters:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {extractedParams.length}
                    </span>
                  </div>
                  {template.recipientLists && Array.isArray(template.recipientLists) && template.recipientLists.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Recipient Lists:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {template.recipientLists.reduce((total, list) => {
                          try {
                            return total + (Array.isArray(list.recipients) ? list.recipients.length : 0);
                          } catch (error) {
                            console.error('Error calculating recipient count:', error);
                            return total;
                          }
                        }, 0)} recipients across {template.recipientLists.length} list(s)
                      </span>
                    </div>
                  )}
                  {template.createdBy && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created By:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {template.createdBy.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error rendering TemplatePreviewDialog:', error);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-sm text-gray-600 mb-4">
              There was an error loading the template preview.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default TemplatePreviewDialog;
