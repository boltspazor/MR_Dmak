import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TemplateNameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (templateName: string) => void;
  title?: string;
  message?: string;
}

const TemplateNameDialog: React.FC<TemplateNameDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Enter Template Name',
  message = 'Please enter a name for this template:'
}) => {
  const [templateName, setTemplateName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    if (templateName.trim().length < 2) {
      setError('Template name must be at least 2 characters');
      return;
    }

    onConfirm(templateName.trim());
    setTemplateName('');
    setError('');
  };

  const handleClose = () => {
    setTemplateName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">{message}</p>
            <input
              type="text"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                setError('');
              }}
              placeholder="Enter template name..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Download Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateNameDialog;
