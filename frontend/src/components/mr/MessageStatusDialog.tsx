import React from 'react';
import { X, CheckCircle, AlertTriangle, Clock, Send, XCircle } from 'lucide-react';
import { Contact } from '../../types/mr.types';

interface MessageStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  statusDetails: {
    status: string;
    errorMessage?: string;
    errorCode?: number;
    errorTitle?: string;
    successMessage?: string;
    timestamp?: string;
  } | null;
  loading?: boolean;
}

const MessageStatusDialog: React.FC<MessageStatusDialogProps> = ({
  isOpen,
  onClose,
  contact,
  statusDetails,
  loading = false
}) => {
  if (!isOpen || !contact) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="h-8 w-8 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'read':
        return <CheckCircle className="h-8 w-8 text-emerald-600" />;
      case 'failed':
        return <AlertTriangle className="h-8 w-8 text-red-600" />;
      case 'pending':
        return <Clock className="h-8 w-8 text-yellow-600" />;
      default:
        return <XCircle className="h-8 w-8 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-blue-600 bg-blue-50';
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'read':
        return 'text-emerald-600 bg-emerald-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Message Sent Successfully';
      case 'delivered':
        return 'Message Delivered';
      case 'read':
        return 'Message Read';
      case 'failed':
        return 'Message Failed';
      case 'pending':
        return 'Message Pending';
      default:
        return 'No Message Sent';
    }
  };

  const getStatusDescription = (status: string, errorMessage?: string) => {
    if (status === 'failed' && errorMessage) {
      return `Error: ${errorMessage}`;
    }
    
    switch (status) {
      case 'sent':
        return 'The message was successfully sent to WhatsApp servers and is being delivered to the recipient.';
      case 'delivered':
        return 'The message was delivered to the recipient\'s device successfully.';
      case 'read':
        return 'The recipient has read the message.';
      case 'failed':
        return 'The message failed to send. Please check the error details below.';
      case 'pending':
        return 'The message is queued and will be sent shortly.';
      default:
        return 'No messages have been sent to this medical representative yet.';
    }
  };

  const messageStatus = contact.messageStatus || 'no_message';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Message Status Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading status details...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* MR Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Medical Representative</h4>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Name:</span> {contact.firstName} {contact.lastName}</p>
                  <p><span className="font-medium">MR ID:</span> {contact.mrId}</p>
                  <p><span className="font-medium">Phone:</span> {contact.phone}</p>
                  {contact.campaignName && (
                    <p><span className="font-medium">Last Campaign:</span> {contact.campaignName}</p>
                  )}
                </div>
              </div>

              {/* Status Info */}
              <div className={`rounded-lg p-4 ${getStatusColor(messageStatus)}`}>
                <div className="flex items-center space-x-3 mb-3">
                  {getStatusIcon(messageStatus)}
                  <div>
                    <h4 className="font-semibold text-lg">{getStatusTitle(messageStatus)}</h4>
                    {statusDetails?.timestamp && (
                      <p className="text-sm opacity-75">
                        {new Date(statusDetails.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm">
                  {getStatusDescription(messageStatus, statusDetails?.errorMessage)}
                </p>
              </div>

              {/* Error Details */}
              {messageStatus === 'failed' && statusDetails && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-medium text-red-800 mb-2">Error Details</h5>
                  <div className="text-sm text-red-700 space-y-1">
                    {statusDetails.errorCode && (
                      <p><span className="font-medium">Error Code:</span> {statusDetails.errorCode}</p>
                    )}
                    {statusDetails.errorTitle && (
                      <p><span className="font-medium">Error Title:</span> {statusDetails.errorTitle}</p>
                    )}
                    {statusDetails.errorMessage && (
                      <p><span className="font-medium">Message:</span> {statusDetails.errorMessage}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Success Details */}
              {['sent', 'delivered', 'read'].includes(messageStatus) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-800 mb-2">Success Details</h5>
                  <p className="text-sm text-green-700">
                    {statusDetails?.successMessage || 'Message processed successfully through WhatsApp Business API.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageStatusDialog;