import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { api } from '../lib/api';
import { useConfirm } from '../contexts/ConfirmContext';
import { Contact } from '../types/mr.types';

interface Group {
  id: string;
  groupName: string;
  description?: string;
  memberCount: number;
}

interface AddMRDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback when MR is successfully added
  contacts: Contact[]; // Pass contacts to determine next MR ID
}

const AddMRDialog: React.FC<AddMRDialogProps> = ({ isOpen, onClose, onSuccess, contacts }) => {
  const { alert } = useConfirm();
  const [formData, setFormData] = useState({
    mrId: '',
    firstName: '',
    lastName: '',
    phone: '',
    groupId: '',
    comments: ''
  });

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
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

  // Function to generate next MR ID
  const generateNextMRId = (): string => {
    if (!contacts || contacts.length === 0) {
      return 'MR001'; // Start with MR001 if no contacts exist
    }

    // Extract numeric part from existing MR IDs and find the highest
    const mrNumbers = contacts
      .map(contact => {
        const match = contact.mrId.match(/MR(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    if (mrNumbers.length === 0) {
      return 'MR001'; // Fallback if no valid MR numbers found
    }

    const highestNumber = Math.max(...mrNumbers);
    const nextNumber = highestNumber + 1;
    
    // Format with leading zeros (e.g., MR001, MR002, etc.)
    return `MR${nextNumber.toString().padStart(3, '0')}`;
  };

  // Fetch groups when dialog opens and auto-fill MR ID
  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      // Auto-fill the MR ID with the next available ID
      const nextMRId = generateNextMRId();
      setFormData(prev => ({
        ...prev,
        mrId: nextMRId
      }));
    }
  }, [isOpen, contacts]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get('/groups');
      const backendGroups = response.data.data || [];
      
      const transformedGroups: Group[] = backendGroups.map((group: any) => ({
        id: group._id || group.id,
        groupName: group.groupName,
        description: group.description,
        memberCount: group.memberCount || 0
      }));
      
      setGroups(transformedGroups);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      // Don't show error for groups fetch failure, just continue
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    
    // Validate required fields
    if (!formData.mrId.trim()) {
      setErrorMessage('❌ MR ID is required');
      setSubmitting(false);
      return;
    }
    if (!formData.firstName.trim()) {
      setErrorMessage('❌ First Name is required');
      setSubmitting(false);
      return;
    }
    if (!formData.lastName.trim()) {
      setErrorMessage('❌ Last Name is required');
      setSubmitting(false);
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('❌ Phone number is required');
      setSubmitting(false);
      return;
    }

    // Validate and normalize phone number
    const phoneResult = normalizePhoneNumber(formData.phone.trim());
    if (!phoneResult.isValid) {
      setErrorMessage(`❌ Invalid phone number: ${phoneResult.error || 'Please enter a valid international phone number'}`);
      setSubmitting(false);
      return;
    }

    try {
      // Prepare data for API
      const mrData = {
        mrId: formData.mrId.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: phoneResult.normalized,
        groupId: formData.groupId || undefined,
        comments: formData.comments.trim() || undefined
      };

      // Call the API
      await api.post('/mrs', mrData);

      // Success - show alert and reset form
      await alert('MR added successfully!', 'success');
      
      // Reset form
      setFormData({
        mrId: '',
        firstName: '',
        lastName: '',
        phone: '',
        groupId: '',
        comments: ''
      });
      
      // Close dialog and notify parent
      onClose();
      onSuccess();
      
    } catch (error: any) {
      console.error('Error adding MR:', error);
      let errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to add MR';
      
      // Clean up error messages
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Real-time phone validation
    if (field === 'phone') {
      if (value.trim()) {
        const phoneResult = normalizePhoneNumber(value.trim());
        setPhoneError(phoneResult.isValid ? '' : phoneResult.error || 'Invalid phone number format');
        setNormalizedPhone(phoneResult.isValid ? phoneResult.normalized : '');
      } else {
        setPhoneError('');
        setNormalizedPhone('');
      }
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      mrId: '',
      firstName: '',
      lastName: '',
      phone: '',
      groupId: '',
      comments: ''
    });
    setErrorMessage('');
    setShowGroupDropdown(false);
    onClose();
  };

  const getSelectedGroupName = () => {
    if (!formData.groupId) return 'Select Group (Optional)';
    const selectedGroup = groups.find(g => g.id === formData.groupId);
    return selectedGroup ? selectedGroup.groupName : 'Select Group (Optional)';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New MR</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">MR ID*</label>
            <input
              type="text"
              value={formData.mrId}
              onChange={(e) => handleChange('mrId', e.target.value)}
              className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100"
              placeholder="Auto-generated MR ID"
              title="MR ID is auto-generated. You can modify it if needed."
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-generated from existing MRs. You can modify if needed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">First Name*</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100"
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Last Name*</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100"
              placeholder="Enter last name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number*</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full px-3 py-3 rounded-lg border-0 ${
                phoneError ? 'bg-red-50 border border-red-200' : 
                normalizedPhone ? 'bg-green-50 border border-green-200' : 
                'bg-gray-100'
              }`}
              placeholder="+91-98765-43210"
            />
            {phoneError && (
              <p className="text-red-600 text-xs mt-1">{phoneError}</p>
            )}
            {normalizedPhone && !phoneError && (
              <p className="text-green-600 text-xs mt-1">
                ✓ Valid: {normalizedPhone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Group (Optional)</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100 text-left flex justify-between items-center focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              >
                <span className={formData.groupId ? 'text-gray-900' : 'text-gray-500'}>
                  {loading ? 'Loading groups...' : getSelectedGroupName()}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showGroupDropdown && !loading && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('groupId', '');
                      setShowGroupDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-gray-500"
                  >
                    No Group
                  </button>
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        handleChange('groupId', group.id);
                        setShowGroupDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 text-gray-900"
                    >
                      {group.groupName}
                      {group.description && (
                        <span className="text-sm text-gray-500 ml-2">- {group.description}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Comments</label>
            <textarea
              value={formData.comments}
              onChange={(e) => handleChange('comments', e.target.value)}
              rows={3}
              className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100"
              placeholder="Enter comments"
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
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{submitting ? 'Adding...' : 'Add MR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMRDialog;