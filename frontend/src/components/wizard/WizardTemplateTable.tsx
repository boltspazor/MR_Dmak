import React from 'react';
import { Eye, CheckCircle, AlertTriangle } from 'lucide-react';
import { WizardTemplate } from '../../pages/CampaignWizard';

interface WizardTemplateTableProps {
  templates: WizardTemplate[];
  selectedTemplate: WizardTemplate | null;
  onTemplateSelect: (template: WizardTemplate) => void;
  onPreview: (template: WizardTemplate) => void;
  loading?: boolean;
}

const hasInvalidImage = (template: WizardTemplate): boolean => {
  // Check if template exists and has metaComponents
  if (!template || !template.metaComponents) {
    return false; // No image issues if no template or no components
  }

  // Check if template expects an image header
  const hasImageHeader = template.metaComponents.some(
    (component: any) => component.type === 'HEADER' && component.format === 'IMAGE'
  );

  // If template doesn't expect an image, it's valid (not grayed out)
  if (!hasImageHeader) return false;

  // Template expects image - check if it has a valid one
  const imageUrl = template.imageUrl;

  // No image URL (empty string, null, or undefined)
  if (!imageUrl || imageUrl.trim() === "") return true;

  // WhatsApp CDN image
  if (imageUrl.includes('scontent.whatsapp.net') || imageUrl.startsWith('meta://')) return true;

  // Has valid custom image
  return false;
};

const WizardTemplateTable: React.FC<WizardTemplateTableProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onPreview,
  loading = false
}) => {
  if (loading) {
    return <div className="animate-pulse">Loading templates...</div>;
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Template Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Category</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Language</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => {
            const hasWhatsAppCDNImage = hasInvalidImage(template);
            const isDisabled = hasWhatsAppCDNImage;
            const isSelected = selectedTemplate?._id === template._id;

            return (
              <tr
                key={template._id}
                className={`border-b transition-colors ${
                  isDisabled 
                    ? 'bg-gray-100 opacity-60 cursor-not-allowed' 
                    : isSelected
                    ? 'bg-indigo-50 hover:bg-indigo-100'
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
                onClick={() => !isDisabled && onTemplateSelect(template)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div>
                      <div className={`font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                        {template.name}
                      </div>
                      {hasWhatsAppCDNImage && (
                        <div className="flex items-center space-x-1 mt-1">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                          <span className="text-xs text-red-600">Default Meta image - upload custom image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className={`py-3 px-4 text-sm ${isDisabled ? 'text-gray-500' : 'text-gray-600'}`}>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isDisabled
                      ? 'bg-gray-200 text-gray-600'
                      : template.metaCategory === 'MARKETING'
                      ? 'bg-purple-100 text-purple-800'
                      : template.metaCategory === 'UTILITY'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {template.metaCategory || 'UTILITY'}
                  </span>
                </td>
                <td className={`py-3 px-4 text-sm ${isDisabled ? 'text-gray-500' : 'text-gray-600'}`}>
                  {template.metaLanguage || 'en_US'}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isDisabled
                      ? 'bg-gray-200 text-gray-600'
                      : template.metaStatus === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : template.metaStatus === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isDisabled && (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {template.metaStatus || 'PENDING'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default WizardTemplateTable;
