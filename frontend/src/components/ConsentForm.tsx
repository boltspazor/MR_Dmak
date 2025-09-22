import React, { useState } from 'react';
import { api } from '../api/config';
import toast from 'react-hot-toast';

interface ConsentFormProps {
  businessName?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface ConsentData {
  phone_e164: string;
  consented: boolean;
  categories: string[];
  channel: string;
  method: string;
  consent_text_version: string;
  business_name_shown: string;
  captured_by: string;
  data_processing_policy_version: string;
  evidence?: {
    session_id?: string;
  };
}

const ConsentForm: React.FC<ConsentFormProps> = ({ 
  businessName = "D-MAK Medical Representatives", 
  onSuccess, 
  onError 
}) => {
  const [formData, setFormData] = useState({
    phone: '',
    categories: [] as string[],
    consentGiven: false,
    loading: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const categoryOptions = [
    { value: 'marketing', label: 'Marketing Communications' },
    { value: 'promotional', label: 'Promotional Offers' },
    { value: 'transactional', label: 'Transactional Messages' },
    { value: 'newsletter', label: 'Newsletter Updates' },
    { value: 'updates', label: 'Product Updates' },
    { value: 'reminders', label: 'Appointment Reminders' }
  ];

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Check if it starts with + and has 10-15 digits after
    const e164Regex = /^\+[1-9]\d{9,14}$/;
    return e164Regex.test(cleaned);
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    
    setFormData(prev => ({ ...prev, phone: formatted }));
    
    // Clear phone error when user starts typing
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked 
        ? [...prev.categories, category]
        : prev.categories.filter(c => c !== category)
    }));
  };

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, consentGiven: e.target.checked }));
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number in international format (e.g., +1234567890)';
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'Please select at least one communication category';
    }

    if (!formData.consentGiven) {
      newErrors.consent = 'You must give consent to proceed';
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
      const consentData: ConsentData = {
        phone_e164: formData.phone,
        consented: formData.consentGiven,
        categories: formData.categories,
        channel: 'web_form',
        method: 'checkbox',
        consent_text_version: '1.0',
        business_name_shown: businessName,
        captured_by: 'user',
        data_processing_policy_version: '1.0',
        evidence: {
          session_id: Math.random().toString(36).substring(7)
        }
      };

      const response = await api.post('/consent/create', consentData);
      
      if (response.data.success) {
        toast.success('Consent recorded successfully!');
        onSuccess?.(response.data.data);
        
        // Reset form
        setFormData({
          phone: '',
          categories: [],
          consentGiven: false,
          loading: false
        });
      } else {
        throw new Error(response.data.message || 'Failed to record consent');
      }

    } catch (error: any) {
      console.error('Consent submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to record consent';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setFormData(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Consent Management</h2>
        <p className="text-gray-600">Manage your communication preferences</p>
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
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={formData.loading}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        {/* Communication Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Communication Categories *
          </label>
          <div className="space-y-2">
            {categoryOptions.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.categories.includes(option.value)}
                  onChange={(e) => handleCategoryChange(option.value, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={formData.loading}
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.categories && (
            <p className="mt-1 text-sm text-red-600">{errors.categories}</p>
          )}
        </div>

        {/* Consent Checkbox */}
        <div>
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={formData.consentGiven}
              onChange={handleConsentChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              disabled={formData.loading}
            />
            <span className="ml-2 text-sm text-gray-700">
              I consent to receive {businessName} communications via the selected channels. 
              I understand that I can opt out at any time by contacting {businessName} or using the opt-out link in future messages. 
              My data will be processed according to the privacy policy.
            </span>
          </label>
          {errors.consent && (
            <p className="mt-1 text-sm text-red-600">{errors.consent}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formData.loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            formData.loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {formData.loading ? 'Recording Consent...' : 'Give Consent'}
        </button>
      </form>

      {/* Privacy Notice */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Privacy Notice</h3>
        <p className="text-xs text-gray-600">
          Your phone number will be stored securely and used only for the communication purposes you've selected. 
          You can update your preferences or opt out at any time. For more information, please review our privacy policy.
        </p>
      </div>
    </div>
  );
};

export default ConsentForm;
