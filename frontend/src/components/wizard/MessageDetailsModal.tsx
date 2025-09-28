import React, { useState, useEffect } from 'react';
import { X, Phone, Clock, CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { campaignProgressAPI } from '../../api/campaign-progress';
import toast from 'react-hot-toast';

interface MessageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  status: 'sent' | 'failed' | 'delivered' | 'read' | 'pending' | 'queued';
  title: string;
}

interface MessageDetail {
  id: string;
  mrId: string;
  phoneNumber: string;
  status: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  errorMessage?: string;
  errorCode?: number;
  errorTitle?: string;
  messageId?: string;
  templateName?: string;
  templateLanguage?: string;
  conversationId?: string;
  pricingCategory?: string;
  lastUpdated: string;
}

const MessageDetailsModal: React.FC<MessageDetailsModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  status,
  title
}) => {
  const [messages, setMessages] = useState<MessageDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    pending: 0,
    queued: 0
  });

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchMessages();
    }
  }, [isOpen, campaignId, status, pagination.page]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await campaignProgressAPI.getCampaignMessageDetails(campaignId, {
        status: status,
        page: pagination.page,
        limit: pagination.limit
      });

      setMessages(response.messages);
      setPagination(response.pagination);
      setStatusCounts(response.statusCounts);
    } catch (error: any) {
      console.error('Error fetching message details:', error);
      toast.error('Failed to load message details');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (messageStatus: string) => {
    switch (messageStatus) {
      case 'sent':
      case 'delivered':
      case 'read':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (messageStatus: string) => {
    switch (messageStatus) {
      case 'sent':
      case 'delivered':
      case 'read':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'pending':
      case 'queued':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">
              {statusCounts[status as keyof typeof statusCounts]} {status} messages
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Status Summary */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-900">Total</div>
                <div className="text-blue-600 font-semibold">{statusCounts.total}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">Sent</div>
                <div className="text-green-600 font-semibold">{statusCounts.sent}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">Failed</div>
                <div className="text-red-600 font-semibold">{statusCounts.failed}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">Pending</div>
                <div className="text-yellow-600 font-semibold">{statusCounts.pending}</div>
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-600">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Phone className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No {status} messages found</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {messages.map((message) => (
                  <div key={message.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(message.status)}
                          <div>
                            <div className="font-medium text-gray-900">
                              {formatPhoneNumber(message.phoneNumber)}
                            </div>
                            <div className="text-sm text-gray-600">
                              MR ID: {message.mrId}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                            {message.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Message Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          {message.messageId && (
                            <div>
                              <span className="font-medium">Message ID:</span> {message.messageId}
                            </div>
                          )}
                          {message.templateName && (
                            <div>
                              <span className="font-medium">Template:</span> {message.templateName}
                            </div>
                          )}
                          {message.sentAt && (
                            <div>
                              <span className="font-medium">Sent:</span> {formatTimestamp(message.sentAt)}
                            </div>
                          )}
                          {message.deliveredAt && (
                            <div>
                              <span className="font-medium">Delivered:</span> {formatTimestamp(message.deliveredAt)}
                            </div>
                          )}
                          {message.readAt && (
                            <div>
                              <span className="font-medium">Read:</span> {formatTimestamp(message.readAt)}
                            </div>
                          )}
                          {message.failedAt && (
                            <div>
                              <span className="font-medium">Failed:</span> {formatTimestamp(message.failedAt)}
                            </div>
                          )}
                          {message.conversationId && (
                            <div>
                              <span className="font-medium">Conversation:</span> {message.conversationId}
                            </div>
                          )}
                          {message.pricingCategory && (
                            <div>
                              <span className="font-medium">Category:</span> {message.pricingCategory}
                            </div>
                          )}
                        </div>

                        {/* Error Details */}
                        {message.errorMessage && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="text-sm text-red-800">
                              <div className="font-medium">Error: {message.errorTitle || 'Message Failed'}</div>
                              <div className="mt-1">{message.errorMessage}</div>
                              {message.errorCode && (
                                <div className="mt-1 text-xs text-red-600">Code: {message.errorCode}</div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-2 text-xs text-gray-500">
                          Last updated: {formatTimestamp(message.lastUpdated)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} messages
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageDetailsModal;
