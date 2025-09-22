import React from 'react';
import { X } from 'lucide-react';
import { Template } from '../../types';

interface TemplatePreviewProps {
  template: Template;
  recipientLists?: any[];
  onPreview: () => void;
  onBulkUpload: () => void;
  onDownload: () => void;
  onRemove: () => void;
  onSelectRecipientList?: (recipientList: any) => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  recipientLists = [],
  onPreview,
  onBulkUpload,
  onDownload,
  onRemove,
  onSelectRecipientList
}) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Template Preview:</p>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-gray-900">{template.name}</h4>
          <div className="flex space-x-2">
            <button
              onClick={onPreview}
              className="text-blue-600 hover:text-blue-800 text-sm"
              title="Preview Template"
            >
              Preview
            </button>
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600 mb-3">
          {template.content.substring(0, 100)}
          {template.content.length > 100 && '...'}
        </div>
        {template.parameters && template.parameters.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Parameters Used:</p>
            <div className="flex flex-wrap gap-1">
              {template.parameters.map((param, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {`{{${param}}}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Available Recipient Lists */}
      {recipientLists && recipientLists.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Available Recipient Lists:</p>
          <div className="space-y-2">
            {recipientLists.map((recipientList, index) => (
              <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-green-800">{recipientList.name}</h5>
                    {recipientList.description && (
                      <p className="text-sm text-green-600 mt-1">{recipientList.description}</p>
                    )}
                    <p className="text-xs text-green-600 mt-1">
                      {recipientList.recipients?.length || 0} recipients
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectRecipientList?.(recipientList)}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePreview;
