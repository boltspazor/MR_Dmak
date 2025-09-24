import React from 'react';
import { Trash2, Loader } from 'lucide-react';
import { Template } from '../../types';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  template: Template | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  template,
  onConfirm,
  onCancel,
  isDeleting = false
}) => {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Template
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {template.isMetaTemplate ? (
                <>
                  Are you sure you want to delete the Meta template <span className="font-medium text-gray-900">"{template.name}"</span>? 
                  <br /><br />
                  <span className="text-orange-600 font-medium">⚠️ This will attempt to delete the template from Meta WhatsApp Business Platform first (if supported), then remove it from the local database.</span>
                  <br /><br />
                  This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete the template <span className="font-medium text-gray-900">"{template.name}"</span>? This action cannot be undone.
                </>
              )}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;
