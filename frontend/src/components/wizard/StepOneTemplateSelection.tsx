import React, { useState, useEffect } from 'react';
import { FileText, Plus, ExternalLink, CheckCircle, ArrowRight } from 'lucide-react';
import { api } from '../../api/config';
import toast from 'react-hot-toast';
import { WizardTemplate } from '../../pages/CampaignWizard';
import { useNavigate } from 'react-router-dom';
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
  selectedTemplate: WizardTemplate | null;
  setSelectedTemplate: (template: WizardTemplate | null) => void;
}

const StepOneTemplateSelection: React.FC<StepOneTemplateSelectionProps> = ({
  stepNumber,
  stepTitle,
  stepDescription,
  onComplete,
  selectedTemplate,
  setSelectedTemplate
}) => {
  const navigate = useNavigate();
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

  const handleTemplateSelect = (template: WizardTemplate) => {
    setSelectedTemplate(template);
    onComplete({ template });
    toast.success(`Selected template: ${template.name}`);
  };

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
            onTemplateSelect={handleTemplateSelect}
            onPreview={handleTemplatePreview}
            loading={loading}
          />
        )}
      </div>

      {/* Selected Template Summary */}
      {selectedTemplate && (
        <div className="mt-6 p-6 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-indigo-900 text-lg">Selected Template</h4>
            <CheckCircle className="w-6 h-6 text-indigo-600" />
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-indigo-800 font-medium text-lg">{selectedTemplate.name}</p>
              <p className="text-sm text-indigo-600">
                {selectedTemplate.type.toUpperCase()} • {selectedTemplate.parameters.length} parameters
              </p>
            </div>
            
            {selectedTemplate.parameters.length > 0 && (
              <div>
                <h5 className="font-medium text-indigo-900 mb-2">Template Parameters:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedTemplate.parameters.map((param, index) => (
                    <div key={index} className="bg-white bg-opacity-50 rounded px-3 py-2">
                      <span className="text-sm font-medium text-indigo-800">{param.name}</span>
                      <span className="text-xs text-indigo-600 ml-2">({param.type})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h5 className="font-medium text-indigo-900 mb-2">Template Preview:</h5>
              <div className="bg-white bg-opacity-50 rounded p-3">
                <p className="text-sm text-indigo-800 whitespace-pre-wrap">
                  {selectedTemplate.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
