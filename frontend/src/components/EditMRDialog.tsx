import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

interface Contact {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  group: string;
  comments?: string;
}

interface Group {
  id: string;
  name: string;
  contactCount: number;
}

interface EditMRDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (contactData: Omit<Contact, 'id'>) => void;
  contact: Contact | null;
  groups: Group[];
}

const EditMRDialog: React.FC<EditMRDialogProps> = ({
  isOpen,
  onClose,
  onUpdate,
  contact,
  groups
}) => {
  const [formData, setFormData] = useState({
    mrId: '',
    firstName: '',
    lastName: '',
    phone: '',
    group: '',
    comments: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');

  // Function to normalize and validate phone number
  const normalizePhoneNumber = (phone: string): { normalized: string; country: string; isValid: boolean; error?: string } => {
    try {
      // First, try to parse the phone number as-is
      if (isValidPhoneNumber(phone)) {
        const parsed = parsePhoneNumber(phone);
        return {
          normalized: parsed.format('E.164'),
          country: parsed.country || 'Unknown',
          isValid: true
        };
      }
      
      // If not valid, try common country codes
      const commonCountries = ['US', 'IN', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'BR', 'MX', 'JP', 'CN', 'KR'];
      
      for (const country of commonCountries) {
        const phoneWithCountry = phone.startsWith('+') ? phone : `+${phone}`;
        if (isValidPhoneNumber(phoneWithCountry)) {
          const parsed = parsePhoneNumber(phoneWithCountry);
          return {
            normalized: parsed.format('E.164'),
            country: parsed.country || country,
            isValid: true
          };
        }
      }
      
      // Try adding country codes for common patterns
      if (phone.length === 10 && !phone.startsWith('0')) {
        // US/Canada format
        const usPhone = `+1${phone}`;
        if (isValidPhoneNumber(usPhone)) {
          const parsed = parsePhoneNumber(usPhone);
          return {
            normalized: parsed.format('E.164'),
            country: parsed.country || 'US',
            isValid: true
          };
        }
      }
      
      if (phone.length === 11 && phone.startsWith('0')) {
        // Remove leading 0 and try with country codes
        const withoutZero = phone.substring(1);
        for (const country of ['IN', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'BR', 'MX']) {
          const phoneWithCountry = `+${withoutZero}`;
          if (isValidPhoneNumber(phoneWithCountry)) {
            const parsed = parsePhoneNumber(phoneWithCountry);
            return {
              normalized: parsed.format('E.164'),
              country: parsed.country || country,
              isValid: true
            };
          }
        }
      }
      
      return {
        normalized: phone,
        country: 'Unknown',
        isValid: false,
        error: 'Invalid phone number format'
      };
    } catch (error) {
      return {
        normalized: phone,
        country: 'Unknown',
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  useEffect(() => {
    if (contact) {
      setFormData({
        mrId: contact.mrId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        group: contact.group,
        comments: contact.comments || ''
      });
      setErrorMessage(''); // Clear any previous error messages
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous errors
    
    if (!formData.mrId || !formData.firstName || !formData.lastName || !formData.phone || !formData.group) {
      setErrorMessage('❌ Please fill in all required fields');
      return;
    }

    // Validate and normalize phone number
    const phoneResult = normalizePhoneNumber(formData.phone.trim());
    if (!phoneResult.isValid) {
      setErrorMessage(`❌ Invalid phone number: ${phoneResult.error || 'Please enter a valid international phone number'}`);
      return;
    }
    
    try {
      onUpdate({
        ...formData,
        phone: phoneResult.normalized
      });
      // Only close and reset if successful
      setErrorMessage('');
      onClose();
    } catch (error: any) {
      let errorMessage = error.message || 'Failed to update MR';
      
      // Clean up error messages to replace technical details with app name
      errorMessage = errorMessage
        .replace(/app\.railway\.app/gi, 'D-MAK')
        .replace(/railway\.app/gi, 'D-MAK')
        .replace(/\.railway\./gi, ' D-MAK ')
        .replace(/mrbackend-production-[a-zA-Z0-9-]+\.up\.railway\.app/gi, 'D-MAK server')
        .replace(/https?:\/\/[a-zA-Z0-9-]+\.up\.railway\.app/gi, 'D-MAK server')
        .replace(/production-[a-zA-Z0-9-]+\.up/gi, 'D-MAK')
        .replace(/\b[a-zA-Z0-9-]+\.up\.railway\.app\b/gi, 'D-MAK server')
        .replace(/\s+/g, ' ')
        .replace(/D-MAK\s+server/gi, 'D-MAK server')
        .trim();
      
      setErrorMessage(`❌ Error: ${errorMessage}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    // Real-time phone validation
    if (e.target.name === 'phone') {
      if (e.target.value.trim()) {
        const phoneResult = normalizePhoneNumber(e.target.value.trim());
        setPhoneError(phoneResult.isValid ? '' : phoneResult.error || 'Invalid phone number format');
        setNormalizedPhone(phoneResult.isValid ? phoneResult.normalized : '');
      } else {
        setPhoneError('');
        setNormalizedPhone('');
      }
    }
  };

  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit MR</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">MR ID *</label>
            <input
              type="text"
              name="mrId"
              value={formData.mrId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              disabled
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">MR ID cannot be changed</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                phoneError ? 'border-red-300 bg-red-50' : 
                normalizedPhone ? 'border-green-300 bg-green-50' : 
                'border-gray-300'
              }`}
              placeholder="+1-555-123-4567, +91-98765-43210, 5551234567, etc."
              required
            />
            {phoneError && (
              <p className="text-red-600 text-xs mt-1">{phoneError}</p>
            )}
            {normalizedPhone && !phoneError && (
              <p className="text-green-600 text-xs mt-1">
                ✓ Valid: {normalizedPhone}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Supports international formats: US (+1), India (+91), UK (+44), Germany (+49), etc.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Group *</label>
            <select
              name="group"
              value={formData.group}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select a group</option>
              {groups.map(group => (
                <option key={group.id} value={group.name}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Comments</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Update MR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMRDialog;
