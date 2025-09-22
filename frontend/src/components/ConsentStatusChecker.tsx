import React, { useState } from 'react';
import { api } from '../api/config';
import toast from 'react-hot-toast';

interface ConsentStatusCheckerProps {
  onStatusFound?: (data: any) => void;
}

interface ConsentStatus {
  phone_e164: string;
  consented: boolean;
  categories: string[];
  channel: string;
  method: string;
  consent_text_version: string;
  timestamp: string;
  opt_out: {
    status: boolean;
    timestamp?: string;
    reason?: string;
    method?: string;
  };
  business_name_shown: string;
  data_processing_policy_version: string;
}

const ConsentStatusChecker: React.FC<ConsentStatusCheckerProps> = ({ onStatusFound }) => {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    const e164Regex = /^\+[1-9]\d{9,14}$/;
    return e164Regex.test(cleaned);
  };

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
    setError('');
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      setError('Phone number is required');
      return;
    }

    if (!validatePhoneNumber(phone)) {
      setError('Please enter a valid phone number in international format (e.g., +1234567890)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/consent/status/${encodeURIComponent(phone)}`);
      
      if (response.data.success) {
        if (response.data.data) {
          setStatus(response.data.data);
          onStatusFound?.(response.data.data);
        } else {
          setStatus(null);
          toast('No consent record found for this phone number');
        }
      } else {
        throw new Error(response.data.message || 'Failed to check consent status');
      }

    } catch (error: any) {
      console.error('Status check error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to check consent status';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (consented: boolean, optOut: boolean) => {
    if (optOut) return 'text-red-600 bg-red-50';
    if (consented) return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStatusText = (consented: boolean, optOut: boolean) => {
    if (optOut) return 'Opted Out';
    if (consented) return 'Consent Given';
    return 'No Consent';
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Consent Status</h2>
        <p className="text-gray-600">Enter your phone number to check your current consent status</p>
      </div>

      <form onSubmit={handleCheckStatus} className="space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="flex space-x-2">
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+1234567890"
              className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !phone}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                loading || !phone
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              {loading ? 'Checking...' : 'Check'}
            </button>
          </div>
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>
      </form>

      {/* Status Display */}
      {status && (
        <div className="mt-6 p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Consent Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.consented, status.opt_out.status)}`}>
              {getStatusText(status.consented, status.opt_out.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Phone Number:</span>
              <p className="text-gray-600">{status.phone_e164}</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Business:</span>
              <p className="text-gray-600">{status.business_name_shown}</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Consent Date:</span>
              <p className="text-gray-600">{formatDate(status.timestamp)}</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Channel:</span>
              <p className="text-gray-600 capitalize">{status.channel.replace('_', ' ')}</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Method:</span>
              <p className="text-gray-600 capitalize">{status.method.replace('_', ' ')}</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Policy Version:</span>
              <p className="text-gray-600">{status.data_processing_policy_version}</p>
            </div>
          </div>

          {/* Categories */}
          <div className="mt-4">
            <span className="font-medium text-gray-700">Communication Categories:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {status.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {category.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Opt-out Information */}
          {status.opt_out.status && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-medium text-red-900 mb-2">Opt-out Details</h4>
              <div className="text-sm text-red-700">
                <p>Opt-out Date: {status.opt_out.timestamp ? formatDate(status.opt_out.timestamp) : 'Unknown'}</p>
                <p>Method: {status.opt_out.method ? status.opt_out.method.replace('_', ' ') : 'Unknown'}</p>
                {status.opt_out.reason && (
                  <p>Reason: {status.opt_out.reason}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Status Found */}
      {status === null && !loading && phone && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Consent Record Found
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>No consent record was found for phone number: {phone}</p>
                <p>You can give consent using the consent form above.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentStatusChecker;
