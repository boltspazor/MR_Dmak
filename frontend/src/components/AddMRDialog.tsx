import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useConfirm } from '../contexts/ConfirmContext';

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
}

const AddMRDialog: React.FC<AddMRDialogProps> = ({ isOpen, onClose, onSuccess }) => {
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

  // Fetch groups when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

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
    if (!formData.phone.startsWith('+91') || formData.phone.length !== 13) {
      setErrorMessage('❌ Phone number must be 13 digits starting with +91');
      setSubmitting(false);
      return;
    }

    try {
      // Prepare data for API
      const mrData = {
        mrId: formData.mrId.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
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
              placeholder="Enter MR ID"
            />
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
              className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100"
              placeholder="+919876543210"
            />
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
