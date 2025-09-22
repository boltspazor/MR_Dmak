import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ErrorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  isSuccess?: boolean;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({
  isOpen,
  onClose,
  title,
  message,
  isSuccess = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
            isSuccess ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isSuccess ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <X className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>
        <div className="text-left">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {title}
          </h3>
          <div className="text-sm text-gray-500 mb-6 whitespace-pre-line text-left">
            {message}
          </div>
          
          {/* Enhanced error details for campaign failures */}
          {message.includes('Campaign failed') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Possible Reasons:</h4>
              <ul className="text-xs text-red-700 space-y-1">
                <li>• Invalid phone number format (must start with +91 and be 13 digits)</li>
                <li>• WhatsApp service temporarily unavailable</li>
                <li>• Recipient has blocked business messages</li>
                <li>• Network connectivity issues</li>
                <li>• Daily message limit exceeded</li>
              </ul>
              <div className="mt-3 text-xs text-red-600">
                💡 <strong>Next Steps:</strong> Check phone numbers, wait a few minutes, and try again.
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 text-white rounded-lg ${
              isSuccess
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPopup;
