import React from 'react';
import { FileText, CheckCircle, Clock, XCircle, Image } from 'lucide-react';
import { Template } from '../../types';
import TemplateActions from './TemplateActions';

interface TemplateTableProps {
  templates: Template[];
  userRole?: string;
  sortField: 'name' | 'createdAt';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'name' | 'createdAt') => void;
  onPreview: (template: Template) => void;
  onExportPNG: (template: Template) => void;
  onDelete: (template: Template) => void;
  onEdit: (template: Template) => void;
  onDuplicate: (template: Template) => void;
}

const TemplateTable: React.FC<TemplateTableProps> = ({
  templates,
  userRole,
  sortField,
  sortDirection,
  onSort,
  onPreview,
  onExportPNG,
  onDelete,
  onEdit,
  onDuplicate
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'PENDING':
        return <Clock className="h-3 w-3 mr-1" />;
      case 'REJECTED':
        return <XCircle className="h-3 w-3 mr-1" />;
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

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-center py-16">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              No Templates Found
            </h3>
            <p className="text-gray-600 max-w-md">
              No templates match your current filters. Try adjusting your search criteria or create a new template.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
              <th
                className="text-left py-4 px-6 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-indigo-100 transition-colors"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center space-x-2">
                  <span>Template Name</span>
                  {sortField === 'name' && (
                    <span className="text-indigo-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="text-left py-4 px-6 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-indigo-100 transition-colors"
                onClick={() => onSort('createdAt')}
              >
                <div className="flex items-center space-x-2">
                  <span>Date Created</span>
                  {sortField === 'createdAt' && (
                    <span className="text-indigo-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {templates.map((template, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {template.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {template.isMetaTemplate && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Meta
                        </span>
                      )}
                      {(template.imageUrl && template.imageUrl.trim() !== '') && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" title="Has Image">
                          <Image className="h-3 w-3 mr-1" />
                          Image
                        </span>
                      )}
                      {template.metaStatus && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(template.metaStatus)}`}>
                          {getStatusIcon(template.metaStatus)}
                          {template.metaStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-gray-600">
                  {new Date(template.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="py-4 px-6">
                  <TemplateActions
                    template={template}
                    userRole={userRole}
                    onPreview={onPreview}
                    onExportPNG={onExportPNG}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TemplateTable;
