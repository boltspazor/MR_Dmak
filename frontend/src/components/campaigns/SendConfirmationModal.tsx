import React from 'react';
import { MessageSquare } from 'lucide-react';

interface SendConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendConfirmationModal: React.FC<SendConfirmationModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="text-left">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Messages Queued Successfully!
          </h3>
          <div className="text-sm text-gray-500 mb-6">
            Your messages have been queued for sending. Please check the Dashboard in 5 minutes to see the status.
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendConfirmationModal;
