import React, { useState } from 'react';
import { api } from '../api/config';
import toast from 'react-hot-toast';

interface OptOutFormProps {
  businessName?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface OptOutData {
  phone_e164: string;
  reason?: string;
  method: string;
}

const OptOutForm: React.FC<OptOutFormProps> = ({ 
  businessName = "D-MAK Medical Representatives", 
  onSuccess, 
  onError 
}) => {
  const [formData, setFormData] = useState({
    phone: '',
    reason: '',
    loading: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
    
    setFormData(prev => ({ ...prev, phone: formatted }));
    
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, reason: e.target.value }));
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number in international format (e.g., +1234567890)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setFormData(prev => ({ ...prev, loading: true }));

    try {
      const optOutData: OptOutData = {
        phone_e164: formData.phone,
        reason: formData.reason || undefined,
        method: 'web_form'
      };

      const response = await api.post('/consent/opt-out', optOutData);
      
      if (response.data.success) {
        toast.success('Opt-out processed successfully!');
        onSuccess?.(response.data.data);
        
        // Reset form
        setFormData({
          phone: '',
          reason: '',
          loading: false
        });
      } else {
        throw new Error(response.data.message || 'Failed to process opt-out');
      }

    } catch (error: any) {
      console.error('Opt-out submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process opt-out';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setFormData(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Opt Out</h2>
        <p className="text-gray-600">Stop receiving communications from {businessName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Phone Number Input */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="+1234567890"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={formData.loading}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        {/* Reason for Opt-out */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Opt-out (Optional)
          </label>
          <textarea
            id="reason"
            value={formData.reason}
            onChange={handleReasonChange}
            placeholder="Please let us know why you're opting out..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={formData.loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.reason.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formData.loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            formData.loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
          }`}
        >
          {formData.loading ? 'Processing Opt-out...' : 'Opt Out'}
        </button>
      </form>

      {/* Confirmation Notice */}
      <div className="mt-6 p-4 bg-red-50 rounded-md">
        <h3 className="text-sm font-medium text-red-900 mb-2">Important Notice</h3>
        <p className="text-xs text-red-700">
          By opting out, you will no longer receive any communications from {businessName}. 
          This action is immediate and will stop all future messages. 
          If you change your mind, you can re-subscribe at any time.
        </p>
      </div>
    </div>
  );
};

export default OptOutForm;
