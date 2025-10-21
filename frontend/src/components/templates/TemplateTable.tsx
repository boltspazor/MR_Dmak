import React from 'react';
import { FileText, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { Template } from '../../types';
import TemplateActions from './TemplateActions';

interface TemplateTableProps {
  templates: Template[];
  sortField: 'name' | 'createdAt';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'name' | 'createdAt') => void;
  onPreview: (template: Template) => void;
  onExportPNG: (template: Template) => void;
  onDelete: (template: Template) => void;
  onSync?: () => Promise<void>;
}

const TemplateTable: React.FC<TemplateTableProps> = ({
  templates,
  sortField,
  sortDirection,
  onSort,
  onPreview,
  onExportPNG,
  onDelete,
  onSync,
}) => {

  // ✅ If no templates, show empty state
  if (!templates || templates.length === 0) {
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
              No templates match your current filters. Try adjusting your search
              criteria or create a new template.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Otherwise, show table
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with Sync Button */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Icon Legend:</h4>
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-xs">M</span>
                </div>
                <span>Marketing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xs">U</span>
                </div>
                <span>Utility</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-500 font-bold text-xs">A</span>
                </div>
                <span>Authentication</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-green-700" />
                </div>
                <span>Approved</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-3 w-3 text-yellow-700" />
                </div>
                <span>Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-3 w-3 text-red-700" />
                </div>
                <span>Rejected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-bold text-xs">I</span>
                </div>
                <span>Has Image</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-700 font-bold text-xs">P</span>
                </div>
                <span>Has Parameters</span>
              </div>
            </div>
          </div>

          {/* Sync Button */}
          {onSync && (
            <button
              onClick={onSync}
              className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Icon Descriptions */}

      {/* Table */}
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
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                Actions
              </th>
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
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {template.metaCategory == "MARKETING" && (
                        <div
                          className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center"
                          title="Meta Template"
                        >
                          <span className="text-blue-700 font-bold text-xs">
                            M
                          </span>
                        </div>
                      )}
                      {template.metaCategory == "UTILITY" && (
                        <div
                          className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center"
                          title="Meta Template"
                        >
                          <span className="text-blue-600 font-bold text-xs">
                            U
                          </span>
                        </div>
                      )}
                      {template.metaCategory == "AUTHENTICATION" && (
                        <div
                          className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center"
                          title="Meta Template"
                        >
                          <span className="text-blue-500 font-bold text-xs">
                            A
                          </span>
                        </div>
                      )}
                      {template.metaStatus === 'APPROVED' && (
                        <div
                          className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center"
                          title="Approved"
                        >
                          <CheckCircle className="h-3 w-3 text-green-700" />
                        </div>
                      )}
                      {template.metaStatus === 'PENDING' && (
                        <div
                          className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center"
                          title="Pending"
                        >
                          <Clock className="h-3 w-3 text-yellow-700" />
                        </div>
                      )}
                      {template.metaStatus === 'REJECTED' && (
                        <div
                          className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center"
                          title="Rejected"
                        >
                          <XCircle className="h-3 w-3 text-red-700" />
                        </div>
                      )}
                      {template.imageUrl?.trim() && (
                        <div
                          className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center"
                          title="Has Image"
                        >
                          <span className="text-purple-700 font-bold text-xs">
                            I
                          </span>
                        </div>
                      )}
                      {template.parameters?.length > 0 && (
                        <div
                          className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center"
                          title="Has Parameters"
                        >
                          <span className="text-orange-700 font-bold text-xs">
                            P
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-gray-600">
                  {new Date(template.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-4 px-6">
                  <TemplateActions
                    template={template}
                    onPreview={onPreview}
                    onExportPNG={onExportPNG}
                    onDelete={onDelete}
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
