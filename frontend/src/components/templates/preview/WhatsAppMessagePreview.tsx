import React from 'react';
import { Template } from '../../../types/index';

interface WhatsAppMessagePreviewProps {
  template: Template;
  processedContent: string;
  imageHeight?: 'h-48' | 'h-64';
}

const WhatsAppMessagePreview: React.FC<WhatsAppMessagePreviewProps> = ({
  template,
  processedContent,
  imageHeight = 'h-64'
}) => {
  const renderHeaderImage = () => {
    if (!template.imageUrl || template.imageUrl.trim() === '') return null;

    const isMetaImage = template.imageUrl.startsWith('meta://');
    const heightClass = imageHeight;

    if (isMetaImage) {
      return (
        <div className={`w-full ${heightClass} bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-b border-gray-200`}>
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
      );
    }

    return (
      <img
        key={template.imageUrl} // Force re-render when imageUrl changes
        src={template.imageUrl}
        alt="Header"
        className={`w-full ${heightClass} object-cover`}
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const container = target.parentElement;
          if (container && !container.querySelector('.error-placeholder')) {
            container.innerHTML = `
              <div class="w-full ${heightClass} bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center error-placeholder">
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
    );
  };

  const renderFooterImage = () => {
    if (!template.footerImageUrl || template.footerImageUrl.trim() === '') return null;

    return (
      <div className="px-4 pb-4">
        <img
          key={template.footerImageUrl} // Force re-render when footerImageUrl changes
          src={template.footerImageUrl}
          alt="Footer"
          className="w-full h-32 object-cover rounded-lg"
          onError={(e) => {
            const container = e.currentTarget.parentElement;
            if (container) container.style.display = 'none';
          }}
        />
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl">
      <div className="flex items-center mb-4">
        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
        <h3 className="text-lg font-semibold text-gray-800">WhatsApp Message Preview</h3>
      </div>

      <div className="flex justify-center">
        <div key={template.imageUrl} className="bg-white rounded-3xl rounded-tl-lg shadow-2xl max-w-sm w-full overflow-hidden">
          {renderHeaderImage()}

          <div className="p-4">
            <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {processedContent}
            </div>
          </div>

          {renderFooterImage()}

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
  );
};

export default WhatsAppMessagePreview;
