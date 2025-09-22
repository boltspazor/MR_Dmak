import React, { useState, useEffect } from 'react';
import { FileText, Plus, ExternalLink, CheckCircle, ArrowRight } from 'lucide-react';
import { api } from '../../api/config';
import toast from 'react-hot-toast';
import { WizardTemplate } from '../../pages/CampaignWizard';
import { useNavigate } from 'react-router-dom';

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
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading templates...</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template._id}
                onClick={() => handleTemplateSelect(template)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedTemplate?._id === template._id
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {template.type.toUpperCase()} • {template.parameters.length} parameters
                      {template.isMetaTemplate && (
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          template.metaStatus === 'APPROVED' 
                            ? 'bg-green-100 text-green-800' 
                            : template.metaStatus === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {template.metaStatus || 'UNKNOWN'}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {template.content.substring(0, 100)}
                      {template.content.length > 100 && '...'}
                    </p>
                  </div>
                  {selectedTemplate?._id === template._id && (
                    <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Template Summary */}
      {selectedTemplate && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
          <h4 className="font-medium text-indigo-900 mb-2">Selected Template</h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-800 font-medium">{selectedTemplate.name}</p>
              <p className="text-sm text-indigo-600">
                {selectedTemplate.type.toUpperCase()} • {selectedTemplate.parameters.length} parameters
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-indigo-600" />
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
    </div>
  );
};

export default StepOneTemplateSelection;
