import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { mrApi } from '../../api/mr';

interface MRStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    id: string;
    mrId: string;
    firstName: string;
    lastName: string;
    metaStatus?: 'ACTIVE' | 'ERROR';
    appStatus?: 'pending' | 'approved' | 'rejected' | 'not_requested';
    lastErrorMessage?: string;
    lastErrorAt?: Date;
    lastErrorCampaignId?: string;
  } | null;
  onStatusUpdated: () => void;
}

const MRStatusDialog: React.FC<MRStatusDialogProps> = ({
  isOpen,
  onClose,
  contact,
  onStatusUpdated
}) => {
  const [metaStatus, setMetaStatus] = useState<'ACTIVE' | 'ERROR'>('ACTIVE');
  const [appStatus, setAppStatus] = useState<'pending' | 'approved' | 'rejected' | 'not_requested'>('not_requested');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (contact) {
      setMetaStatus(contact.metaStatus || 'ACTIVE');
      setAppStatus(contact.appStatus || 'not_requested');
    }
  }, [contact]);

  const handleSave = async () => {
    if (!contact) return;

    setLoading(true);
    setError(null);

    try {
      await mrApi.updateStatus(contact.id, {
        metaStatus,
        appStatus
      });
      
      onStatusUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (statusType: 'metaStatus' | 'appStatus' | 'both') => {
    if (!contact) return;

    setLoading(true);
    setError(null);

    try {
      await mrApi.resetStatus(contact.id, statusType);
      
      if (statusType === 'metaStatus' || statusType === 'both') {
        setMetaStatus('ACTIVE');
      }
      if (statusType === 'appStatus' || statusType === 'both') {
        setAppStatus('not_requested');
      }
      
      onStatusUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to reset status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !contact) return null;

  const getStatusIcon = (status: string, type: 'meta' | 'app') => {
    if (type === 'meta') {
      switch (status) {
        case 'ACTIVE':
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'ERROR':
          return <XCircle className="h-4 w-4 text-red-600" />;
        default:
          return <CheckCircle className="h-4 w-4 text-green-600" />;
      }
    } else {
      switch (status) {
        case 'approved':
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'rejected':
          return <XCircle className="h-4 w-4 text-red-600" />;
        case 'pending':
          return <Clock className="h-4 w-4 text-yellow-600" />;
        default:
          return <Clock className="h-4 w-4 text-gray-600" />;
      }
    }
  };

  const getStatusColor = (status: string, type: 'meta' | 'app') => {
    if (type === 'meta') {
      switch (status) {
        case 'ACTIVE':
          return 'bg-green-100 text-green-800';
        case 'ERROR':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-green-100 text-green-800';
      }
    } else {
      switch (status) {
        case 'approved':
          return 'bg-green-100 text-green-800';
        case 'rejected':
          return 'bg-red-100 text-red-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Manage MR Status
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              {contact.firstName} {contact.lastName} ({contact.mrId})
            </h4>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-2">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Meta Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Status (Previous Failed Message Status)
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(metaStatus, 'meta')}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metaStatus, 'meta')}`}>
                  {metaStatus}
                </span>
              </div>
              <select
                value={metaStatus}
                onChange={(e) => setMetaStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="ERROR">Error</option>
              </select>
            </div>
            {contact.lastErrorMessage && (
              <div className="mt-2 text-xs text-gray-500">
                <p><strong>Last Error:</strong> {contact.lastErrorMessage}</p>
                {contact.lastErrorAt && (
                  <p><strong>Error Date:</strong> {new Date(contact.lastErrorAt).toLocaleString()}</p>
                )}
                {contact.lastErrorCampaignId && (
                  <p><strong>Campaign ID:</strong> {contact.lastErrorCampaignId}</p>
                )}
              </div>
            )}
          </div>

          {/* App Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              App Status (Consent Status)
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(appStatus, 'app')}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appStatus, 'app')}`}>
                  {appStatus}
                </span>
              </div>
              <select
                value={appStatus}
                onChange={(e) => setAppStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="not_requested">Not Requested</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex space-x-2">
            <button
              onClick={() => handleReset('metaStatus')}
              disabled={loading}
              className="px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              Reset Meta
            </button>
            <button
              onClick={() => handleReset('appStatus')}
              disabled={loading}
              className="px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              Reset App
            </button>
            <button
              onClick={() => handleReset('both')}
              disabled={loading}
              className="px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              Reset Both
            </button>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MRStatusDialog;
