import React from 'react';
import { Eye, Download, Trash2, Edit, Copy } from 'lucide-react';
import { Template } from '../../types';

interface TemplateActionsProps {
  template: Template;
  userRole?: string;
  onPreview: (template: Template) => void;
  onExportPNG: (template: Template) => void;
  onDelete: (template: Template) => void;
  onEdit: (template: Template) => void;
  onDuplicate: (template: Template) => void;
}

const TemplateActions: React.FC<TemplateActionsProps> = ({
  template,
  userRole,
  onPreview,
  onExportPNG,
  onDelete,
  onEdit,
  onDuplicate
}) => {
  const canEdit = userRole === 'super-admin' && !template.isMetaTemplate;
  const canDelete = !template.isMetaTemplate;

  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={() => onPreview(template)}
        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Preview Template"
      >
        <Eye className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => onExportPNG(template)}
        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        title="Export as PNG"
      >
        <Download className="h-4 w-4" />
      </button>
      
      {canEdit && (
        <>
          <button
            onClick={() => onEdit(template)}
            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Edit Template"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDuplicate(template)}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Duplicate Template"
          >
            <Copy className="h-4 w-4" />
          </button>
        </>
      )}
      
      {canDelete && (
        <button
          onClick={() => onDelete(template)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete Template"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default TemplateActions;
