import React from 'react';
import { FileText, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { WizardTemplate } from '../../pages/CampaignWizard';
import { SkeletonTable } from '../ui/SkeletonLoader';

interface WizardTemplateTableProps {
  templates: WizardTemplate[];
  selectedTemplate: WizardTemplate | null;
  onTemplateSelect: (template: WizardTemplate) => void;
  onPreview: (template: WizardTemplate) => void;
  loading?: boolean;
}

const WizardTemplateTable: React.FC<WizardTemplateTableProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onPreview,
  loading = false
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  if (loading) {
    return <SkeletonTable rows={4} columns={5} />;
  }

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 text-sm">
            Create your first Meta template to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-indigo-50">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                Template Name
              </th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                Type
              </th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                Parameters
              </th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr 
                key={template._id} 
                className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedTemplate?._id === template._id ? 'bg-indigo-50' : ''
                }`}
                onClick={() => onTemplateSelect(template)}
              >
                <td className="py-3 px-6 text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {template.content.substring(0, 60)}
                        {template.content.length > 60 && '...'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-6 text-sm text-gray-900">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {template.type.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-6 text-sm text-gray-900">
                  {template.parameters.length} parameters
                </td>
                <td className="py-3 px-6 text-sm">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(template.metaStatus)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.metaStatus)}`}>
                      {template.metaStatus || 'UNKNOWN'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-6 text-sm">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreview(template);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium hover:underline flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Preview</span>
                    </button>
                    {selectedTemplate?._id === template._id && (
                      <CheckCircle className="h-4 w-4 text-indigo-600" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WizardTemplateTable;
