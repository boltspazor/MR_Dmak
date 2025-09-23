import React from 'react';
import { Send, ChevronDown } from 'lucide-react';
import { Template } from '../../types';
import TemplatePreview from './TemplatePreview';
import RecipientListSection from './RecipientListSection';
import { useTemplateRecipients } from '../../hooks/useTemplateRecipients';

interface TemplateMessagesTabProps {
  templates: Template[];
  campaignName: string;
  setCampaignName: (name: string) => void;
  selectedTemplate: Template | null;
  setSelectedTemplate: (template: Template | null) => void;
  selectedTemplateDropdown: string;
  setSelectedTemplateDropdown: (value: string) => void;
  selectedRecipientList: any;
  setSelectedRecipientList: (list: any) => void;
  onTemplatePreview: (template: Template) => void;
  onBulkUploadRecipients: (template: Template) => void;
  onDownloadTemplateCSV: (template: Template) => void;
  onSubmit: () => void;
  showError: (title: string, message: string, isSuccess?: boolean) => void;
  onShowCreateRecipientList: () => void;
}

const TemplateMessagesTab: React.FC<TemplateMessagesTabProps> = ({
  templates,
  campaignName,
  setCampaignName,
  selectedTemplate,
  setSelectedTemplate,
  selectedTemplateDropdown,
  setSelectedTemplateDropdown,
  selectedRecipientList,
  setSelectedRecipientList,
  onTemplatePreview,
  onBulkUploadRecipients,
  onDownloadTemplateCSV,
  onSubmit,
  showError: _showError,
  onShowCreateRecipientList
}) => {
  const handleTemplateDropdownChange = (templateId: string) => {
    if (!templateId) return;
    const template = (templates || []).find(t => t?._id === templateId);
    if (template) {
      setSelectedTemplate(template);
    }
    setSelectedTemplateDropdown('');
  };

  // Get recipients for the selected template
  const { recipients: selectedTemplateRecipients } = useTemplateRecipients(selectedTemplate?._id);

  return (
    <div className="space-y-6">
      {/* Campaign Name */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Name</h3>
        <input
          type="text"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          placeholder="Enter campaign name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Template Selection Dropdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Template</h3>
        <div className="space-y-4">
          <div className="relative">
            <select
              value={selectedTemplateDropdown}
              onChange={(e) => handleTemplateDropdownChange(e.target.value)}
              className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">Select a template</option>
              {(templates || []).map(template => (
                <option key={template?._id} value={template?._id}>
                  {template?.name}
                </option>
              ))}
            </select>
            <ChevronDown className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <TemplatePreview
              template={selectedTemplate}
              recipientLists={selectedTemplateRecipients}
              onPreview={() => onTemplatePreview(selectedTemplate)}
              onBulkUpload={() => onBulkUploadRecipients(selectedTemplate)}
              onDownload={() => onDownloadTemplateCSV(selectedTemplate)}
              onRemove={() => {
                setSelectedTemplate(null);
                setSelectedTemplateDropdown('');
              }}
              onSelectRecipientList={setSelectedRecipientList}
            />
          )}
        </div>
      </div>

      {/* Recipient List Section */}
      <RecipientListSection
        selectedRecipientList={selectedRecipientList}
        setSelectedRecipientList={setSelectedRecipientList}
        onShowCreateRecipientList={onShowCreateRecipientList}
      />

      {/* Send Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onSubmit}
          disabled={!selectedTemplate || !selectedRecipientList || !campaignName.trim()}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          <Send className="h-5 w-5" />
          <span>Send & Activate Campaign</span>
        </button>
      </div>
    </div>
  );
};

export default TemplateMessagesTab;
