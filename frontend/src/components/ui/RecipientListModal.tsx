
import React, { useMemo } from 'react';
import { X } from 'lucide-react';

export interface GroupMember {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  name?: string;
  phone: string;
  email?: string;
  group: string;
  status: 'queued' | 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
  messageId?: string;
}

interface RecipientListModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: GroupMember[];
  campaignName?: string;
}

const RecipientListModal: React.FC<RecipientListModalProps> = ({
  isOpen,
  onClose,
  recipients,
  campaignName = 'Campaign'
}) => {
  // Get recipients with proper name formatting
  const actualRecipients = useMemo(() => {
    return recipients.map(recipient => ({
      ...recipient,
      name: recipient.name || `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim()
    }));
  }, [recipients]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = actualRecipients.length;
    const received = actualRecipients.filter(r => r.status === 'delivered' || r.status === 'read').length;
    const failed = actualRecipients.filter(r => r.status === 'failed').length;
    const successRate = total > 0 ? Math.round((received / total) * 100) : 0;
    
    return { total, received, failed, successRate };
  }, [actualRecipients]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Recipient List Details
            </h2>
            {campaignName && (
              <p className="text-sm text-gray-600 mt-1">
                Campaign: {campaignName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Summary Section */}
        <div className="bg-indigo-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Received</p>
              <p className="text-2xl font-bold text-green-600">{stats.received}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
            </div>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b bg-indigo-50">
            <h3 className="text-lg font-semibold text-gray-900">Recipients</h3>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            {actualRecipients.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No recipients found
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-indigo-50">
                  <tr className="border-b">
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Phone</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {actualRecipients.map((recipient, index) => (
                    <tr key={recipient.mrId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-6 text-sm text-gray-900">{recipient.name}</td>
                      <td className="py-3 px-6 text-sm text-gray-900">{recipient.phone}</td>
                      <td className="py-3 px-6 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          recipient.status === 'delivered' || recipient.status === 'read'
                            ? 'bg-green-100 text-green-800'
                            : recipient.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {recipient.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipientListModal;