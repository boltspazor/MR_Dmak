import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

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

interface AddMRDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (contact: Omit<Contact, 'id'>) => void;
  groups: Group[];
}

const AddMRDialog: React.FC<AddMRDialogProps> = ({ isOpen, onClose, onAdd, groups }) => {
  const [formData, setFormData] = useState({
    mrId: '',
    firstName: '',
    lastName: '',
    phone: '',
    group: '',
    comments: ''
  });

  // Debug: Log groups when component renders
  console.log('AddMRDialog groups:', groups);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.mrId || !formData.firstName || !formData.lastName || !formData.phone || !formData.group) {
      alert('Please fill in all required fields');
      return;
    }

    onAdd(formData);
    setFormData({
      mrId: '',
      firstName: '',
      lastName: '',
      phone: '',
      group: '',
      comments: ''
    });
    onClose();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New MR</h2>
          <button
            onClick={onClose}
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
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Select Group*</label>
            <div className="relative">
              <select
                value={formData.group}
                onChange={(e) => handleChange('group', e.target.value)}
                className="w-full px-3 py-3 rounded-lg border-0 bg-gray-100 appearance-none"
              >
                <option value="">Select a group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.name}>{group.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add MR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMRDialog;
