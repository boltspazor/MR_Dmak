import React from 'react';
import { Trash2 } from 'lucide-react';
import { Contact } from '../../types/mr.types';

interface MRDeleteDialogProps {
  isOpen: boolean;
  contactToDelete: Contact | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const MRDeleteDialog: React.FC<MRDeleteDialogProps> = ({
  isOpen,
  contactToDelete,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !contactToDelete) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-200">
      <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-200 transform transition-all duration-200">
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Delete MR
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Are you sure you want to delete MR <span className="font-semibold text-gray-900">{contactToDelete.mrId}</span> ({contactToDelete.firstName} {contactToDelete.lastName})? 
            <br />
            <span className="text-red-600 font-medium">This action cannot be undone.</span>
          </p>
          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MRDeleteDialog;
