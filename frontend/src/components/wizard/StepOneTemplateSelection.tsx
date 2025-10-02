import React, { useState, useEffect } from 'react';
import { FileText, Plus, ArrowRight } from 'lucide-react';
import { api } from '../../api/config';
import toast from 'react-hot-toast';
import { WizardTemplate } from '../../pages/CampaignWizard';
import WizardTemplateTable from './WizardTemplateTable';
import TemplatePreviewDialog from '../ui/TemplatePreviewDialog';
import { SkeletonTable } from '../ui/SkeletonLoader';

interface StepOneTemplateSelectionProps {
  stepNumber: number;
  stepTitle: string;
  stepDescription: string;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  campaignName: string;
  selectedTemplate: WizardTemplate | null;
  setCampaignName: (name: string) => void;
  setSelectedTemplate: (template: WizardTemplate | null) => void;
}

const StepOneTemplateSelection: React.FC<StepOneTemplateSelectionProps> = ({
  stepTitle,
  stepDescription,
  onComplete,
  campaignName,
  selectedTemplate,
  setCampaignName,
  setSelectedTemplate
}) => {
  const [templates, setTemplates] = useState<WizardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<WizardTemplate | null>(null);

  // Load Meta templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        console.log('Loading Meta templates from API...');
        const response = await api.get('/meta-templates/all');
        console.log('Meta templates API response:', response.data);
        const templatesData = response.data.data || response.data || [];
        console.log('Meta templates data:', templatesData);
        setTemplates(templatesData);
        if (templatesData.length === 0) {
          toast('No Meta templates found. You can create new ones using the Meta Developer Tools.');
        }
      } catch (error: any) {
        console.error('Failed to load Meta templates:', error);
        toast.error(`Failed to load Meta templates: ${error.message || 'Unknown error'}`);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);



  const handleTemplatePreview = (template: WizardTemplate) => {
    setPreviewTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleCreateNew = async () => {
    try {
      // Get Meta template creation URL
      const response = await api.get('/meta-templates/meta-urls/creation');
      const url = response.data.data.url;
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Failed to get Meta template creation URL:', error);
      toast.error('Failed to open Meta template creation page. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Step Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{stepTitle}</h2>
          <p className="mt-2 text-gray-600">{stepDescription}</p>
        </div>

        {/* Templates List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Available Templates</h3>
            <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <SkeletonTable rows={4} columns={5} />
        </div>
      </div>
    );
  }

  const handleCampaignNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCampaignName(name);
    // Update completion data whenever campaign name changes
    if (name.trim() !== '' && selectedTemplate) {
      onComplete({ campaignName: name, template: selectedTemplate });
    }
  };

  const handleTemplateSelection = (template: WizardTemplate) => {
    setSelectedTemplate(template);
    // Update completion data whenever template changes
    if (campaignName.trim() !== '' && template) {
      onComplete({ campaignName, template });
    }
    toast.success(`Selected template: ${template.name}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{stepTitle}</h2>
        <p className="mt-2 text-gray-600">{stepDescription}</p>
      </div>

      {/* Campaign Name Input */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          id="campaignName"
          value={campaignName}
          onChange={handleCampaignNameChange}
          placeholder="Enter a name for your campaign"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
        {campaignName.trim() === '' && (
          <p className="mt-1 text-sm text-red-600">Campaign name is required</p>
        )}
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Available Templates</h3>
          <button
            onClick={handleCreateNew}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Meta Template</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Meta templates found</h4>
            <p className="text-gray-600 mb-4">Create your first Meta template to get started</p>
            <button
              onClick={handleCreateNew}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Meta Template
            </button>
          </div>
        ) : (
          <WizardTemplateTable
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelection}
            onPreview={handleTemplatePreview}
            loading={loading}
          />
        )}
      </div>

      {/* Step Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 What's Next?</h4>
        <p className="text-sm text-blue-800">
          {selectedTemplate 
            ? `Great! You've selected "${selectedTemplate.name}". In the next step, you'll select recipients and create your campaign.`
            : "Select a Meta template from the list above or create a new one using the Meta Developer Tools to continue with your campaign."
          }
        </p>
      </div>

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        isOpen={showTemplatePreview}
        onClose={() => setShowTemplatePreview(false)}
        template={previewTemplate}
        showDownloadButton={false}
        variant="full"
      />
    </div>
  );
};

export default StepOneTemplateSelection;
