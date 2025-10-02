import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Upload, Users, CheckCircle } from 'lucide-react';
import { Template } from '../../types';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface TemplatePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  onDownloadRecipientList?: (template: Template) => void;
  onBulkUploadRecipients?: (template: Template) => void;
  showDownloadButton?: boolean;
  showBulkUploadButton?: boolean;
  variant?: 'full' | 'compact' | 'panel'; // full: Templates page style, compact: Campaigns/Dashboard style, panel: Fixed panel style
  onUpdateTemplate?: (templateId: string, updates: Partial<Template>) => Promise<void>;
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
  // onUpdateTemplate - not used after removing Template Details section
}) => {

  
  // Recipient list functionality
  const [recipientLists, setRecipientLists] = useState<any[]>([]);
  const [selectedRecipientList, setSelectedRecipientList] = useState<any>(null);
  const [loadingRecipientLists, setLoadingRecipientLists] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);

  // Load recipient lists when template changes
  useEffect(() => {
    const loadRecipientLists = async () => {
      if (template && isOpen) {
        try {
          setLoadingRecipientLists(true);
          console.log('Loading recipient lists for template:', template._id);
          const response = await api.get(`/recipient-lists/template/${template._id}`);
          const listsData = response.data.data || response.data || [];
          console.log('Loaded recipient lists:', listsData);
          setRecipientLists(listsData);
          
          // Auto-select the first recipient list if available
          if (listsData.length > 0) {
            console.log('Auto-selecting first recipient list:', listsData[0]);
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
  }, [template, isOpen]);



  if (!isOpen || !template) return null;

  try {
    // Ensure template has required properties
    if (!template.name || !template.content) {
      console.error('Template missing required properties:', template);
      return null;
    }

    // Extract parameters from content and categorize them
    const extractParameters = (content: string): Array<{name: string, type: 'text' | 'number'}> => {
      const paramRegex = /\{\{([A-Za-z0-9_]+)\}\}/g;
      const matches = content.match(paramRegex);
      if (!matches) return [];
      
      const uniqueParams = [...new Set(matches.map(match => match.replace(/\{\{|\}\}/g, '')))];
      
      // Categorize parameters based on common naming patterns
      return uniqueParams.map(param => {
        // Parameters that are likely numbers
        const numericPatterns = [
          'target', 'achievement', 'count', 'number', 'amount', 'price', 'value',
          'score', 'rate', 'percentage', 'total', 'sum', 'quantity', 'qty',
          'year', 'month', 'day', 'hour', 'minute', 'second', 'time',
          'age', 'weight', 'height', 'distance', 'length', 'width', 'depth'
        ];
        
        // Parameters that are likely text/names
        const textPatterns = [
          'name', 'firstname', 'lastname', 'fn', 'ln', 'title', 'company',
          'location', 'city', 'state', 'country', 'address', 'email',
          'product', 'productname', 'category', 'type', 'status', 'group',
          'doctor', 'patient', 'customer', 'client', 'user', 'person'
        ];
        
        const lowerParam = param.toLowerCase();
        
        // Check if it's likely a number parameter
        if (numericPatterns.some(pattern => lowerParam.includes(pattern))) {
          return { name: param, type: 'number' as const };
        }
        
        // Check if it's likely a text parameter
        if (textPatterns.some(pattern => lowerParam.includes(pattern))) {
          return { name: param, type: 'text' as const };
        }
        
        // Default to text for unknown parameters
        return { name: param, type: 'text' as const };
      });
    };

    const extractedParams = template.parameters?.length > 0 
      ? template.parameters.map(param => typeof param === 'string' 
          ? { name: param, type: 'text' as const }
          : { name: param.name, type: param.type || 'text' as const })
      : extractParameters(template.content || '');

    // Sample parameter values for preview

    // Process content - keep parameters as placeholders
    const processContent = (content: string): string => {
      try {
        let processedContent = content || '';

        // Keep parameters as placeholders - don't replace with sample values
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
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl max-w-lg mx-auto">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <h3 className="text-lg font-semibold text-gray-800">WhatsApp Message Preview</h3>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white rounded-3xl rounded-tl-lg shadow-2xl max-w-sm w-full overflow-hidden">
                    {/* Header Image - Show placeholder for Meta templates with images */}
                    {template.imageUrl && template.imageUrl.trim() !== '' && (
                      <div className="w-full">
                        {template.imageUrl.startsWith('meta://') ? (
                          // Show placeholder for Meta template images
                          <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-b border-gray-200">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-sm text-gray-600 font-medium">Template Image</p>
                              <p className="text-xs text-gray-500">Image will appear in messages</p>
                            </div>
                          </div>
                        ) : (
                          // Show actual image for regular templates
                          <img
                            src={template.imageUrl}
                            alt="Header"
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              // Replace with placeholder on error
                              const container = e.currentTarget.parentElement;
                              if (container) {
                                container.innerHTML = `
                                  <div class="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                    <div class="text-center">
                                      <div class="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                      </div>
                                      <p class="text-xs text-gray-500">Image unavailable</p>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {processedContent}
                      </div>
                    </div>

                    {/* Footer Image - Only show if image exists and loads successfully */}
                    {template.footerImageUrl && template.footerImageUrl.trim() !== '' && (
                      <div className="px-4 pb-4">
                        <img
                          src={template.footerImageUrl}
                          alt="Footer"
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            // Hide the image container completely on error
                            const container = e.currentTarget.parentElement;
                            if (container) {
                              container.style.display = 'none';
                            }
                          }}
                        />
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
                        <div className="flex items-center">
                          <svg className="w-3 h-3 text-gray-500" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M10.5 3.5L4.5 9.5L1.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                          <svg className="w-3 h-3 text-gray-500 ml-0.5" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M10.5 3.5L4.5 9.5L1.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
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
                    {extractedParams.map((param, index: number) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          param.type === 'number' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}
                        title={`Parameter type: ${param.type}`}
                      >
                        {`{{${param.name}}}`} 
                        <span className="ml-1 text-xs opacity-75">
                          ({param.type})
                        </span>
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

    if (variant === 'panel') {
      // Panel variant for fixed position (like in Campaign Wizard)
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <h3 className="text-lg font-semibold text-gray-800">WhatsApp Message Preview</h3>
            </div>

            <div className="flex justify-center">
              <div className="bg-white rounded-3xl rounded-tl-lg shadow-2xl max-w-sm w-full overflow-hidden">
                {/* Header Image - Show placeholder for Meta templates with images */}
                {template.imageUrl && template.imageUrl.trim() !== '' && (
                  <div className="w-full">
                    {template.imageUrl.startsWith('meta://') ? (
                      // Show placeholder for Meta template images
                      <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-b border-gray-200">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600 font-medium">Template Image</p>
                          <p className="text-xs text-gray-500">Image will appear in messages</p>
                        </div>
                      </div>
                    ) : (
                      // Show actual image for regular templates
                      <img
                        src={template.imageUrl}
                        alt="Header"
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          // Replace with placeholder on error
                          const container = e.currentTarget.parentElement;
                          if (container) {
                            container.innerHTML = `
                              <div class="w-full h-64 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                <div class="text-center">
                                  <div class="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                  </div>
                                  <p class="text-xs text-gray-500">Image unavailable</p>
                                </div>
                              </div>
                            `;
                          }
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Message Content */}
                <div className="p-4">
                  <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {processedContent}
                  </div>
                </div>

                {/* Footer Image - Only show if image exists and loads successfully */}
                {template.footerImageUrl && template.footerImageUrl.trim() !== '' && (
                  <div className="px-4 pb-4">
                    <img
                      src={template.footerImageUrl}
                      alt="Footer"
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        // Hide the image container completely on error
                        const container = e.currentTarget.parentElement;
                        if (container) {
                          container.style.display = 'none';
                        }
                      }}
                    />
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
                    <div className="flex items-center">
                      <svg className="w-3 h-3 text-gray-500" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M10.5 3.5L4.5 9.5L1.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                      <svg className="w-3 h-3 text-gray-500 ml-0.5" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M10.5 3.5L4.5 9.5L1.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
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
                      {/* Header Image - Show placeholder for Meta templates with images */}
                      {template.imageUrl && template.imageUrl.trim() !== '' && (
                        <div className="w-full">
                          {template.imageUrl.startsWith('meta://') ? (
                            // Show placeholder for Meta template images
                            <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-b border-gray-200">
                              <div className="text-center">
                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <p className="text-sm text-gray-600 font-medium">Template Image</p>
                                <p className="text-xs text-gray-500">Image will appear in messages</p>
                              </div>
                            </div>
                          ) : (
                            // Show actual image for regular templates
                            <img
                              src={template.imageUrl}
                              alt="Header"
                              className="w-full h-64 object-cover"
                              onError={(e) => {
                                // Replace with placeholder on error
                                const container = e.currentTarget.parentElement;
                                if (container) {
                                  container.innerHTML = `
                                    <div class="w-full h-64 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                      <div class="text-center">
                                        <div class="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                          </svg>
                                        </div>
                                        <p class="text-xs text-gray-500">Image unavailable</p>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          )}
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="p-4">
                        <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {processedContent}
                        </div>
                      </div>

                      {/* Footer Image - Only show if image exists and loads successfully */}
                      {template.footerImageUrl && template.footerImageUrl.trim() !== '' && (
                        <div className="px-4 pb-4">
                          <img
                            src={template.footerImageUrl}
                            alt="Footer"
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              // Hide the image container completely on error
                              const container = e.currentTarget.parentElement;
                              if (container) {
                                container.style.display = 'none';
                              }
                            }}
                          />
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
                          <div className="flex items-center">
                            <svg className="w-3 h-3 text-gray-500" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M10.5 3.5L4.5 9.5L1.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                            <svg className="w-3 h-3 text-gray-500 ml-0.5" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M10.5 3.5L4.5 9.5L1.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Parameters */}
              <div className="space-y-6">

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
                            className={`px-3 py-2 text-sm rounded-lg font-medium ${
                              param.type === 'number' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}
                            title={`Parameter type: ${param.type}`}
                          >
                            {`{{${param.name}}}`} 
                            <span className="ml-1 text-xs opacity-75">
                              ({param.type})
                            </span>
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





                {/* Recipient Lists Section */}
                {template.parameters && template.parameters.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <Users className="h-5 w-5 text-indigo-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Recipient Lists</h3>
                    </div>
                    
                    {loadingRecipientLists ? (
                      <div className="space-y-3">
                        <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
                        <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
                      </div>
                    ) : recipientLists.length > 0 ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Recipient List
                          </label>
                          <select
                            value={selectedRecipientList?._id || ''}
                            onChange={(e) => {
                              const list = recipientLists.find(l => l._id === e.target.value);
                              setSelectedRecipientList(list);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select a recipient list</option>
                            {recipientLists.map((list) => {
                              const recipientNames = list.recipients && list.recipients.length > 0 
                                ? list.recipients.slice(0, 2).map((r: any) => `${r.firstName} ${r.lastName}`).join(', ') + 
                                  (list.recipients.length > 2 ? ` +${list.recipients.length - 2} more` : '')
                                : 'No recipients';
                              
                              return (
                                <option key={list._id} value={list._id}>
                                  {list.name} ({recipientNames})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        
                        {selectedRecipientList && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                  {selectedRecipientList.name}
                                </span>
                              </div>
                              <button
                                onClick={() => setShowRecipients(!showRecipients)}
                                className="text-xs text-green-600 hover:text-green-700"
                              >
                                {showRecipients ? 'Hide' : 'Show'} Recipients
                              </button>
                            </div>
                            <div className="text-xs text-green-600">
                              {selectedRecipientList.recipients?.length || selectedRecipientList.data?.length || 0} recipients ready
                            </div>
                            
                            {/* Show individual recipient names */}
                            {showRecipients && selectedRecipientList.recipients && selectedRecipientList.recipients.length > 0 && (
                              <div className="mt-3 border-t border-green-200 pt-3">
                                <div className="text-xs text-green-700 font-medium mb-2">Recipients:</div>
                                <div className="max-h-32 overflow-y-auto">
                                  <div className="grid grid-cols-1 gap-1">
                                    {selectedRecipientList.recipients.map((recipient: any, index: number) => (
                                      <div key={recipient._id || index} className="text-xs text-green-600 bg-white rounded px-2 py-1">
                                        {recipient.firstName} {recipient.lastName}
                                        {recipient.phone && (
                                          <span className="text-gray-500 ml-2">({recipient.phone})</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No recipient lists found for this template.</p>
                        <p className="text-xs">Create a recipient list to see recipients here.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Information Section - Moved to right side */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Information</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">
                      <strong>CSV Format:</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      • Row 1: Template Name in A1, template name in B1<br />
                      • Row 2: MR ID, First Name, Last Name{template ? extractParameters(template.content).map(p => p.name).join(', ') : ''}<br />
                      • Each parameter will have its own column in the recipient list
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Template Actions - Bottom left below WhatsApp preview */}
            {(showDownloadButton && onDownloadRecipientList) || (showBulkUploadButton && onBulkUploadRecipients) ? (
              <div className="flex justify-start mt-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md">
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
                </div>
              </div>
            ) : null}
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
