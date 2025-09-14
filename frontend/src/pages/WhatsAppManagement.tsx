import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Phone, 
  Plus, 
  Trash2, 
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface AllowedRecipient {
  phoneNumber: string;
  formatted: string;
  addedDate?: string;
  addedBy?: string;
}

const WhatsAppManagement: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dmat');
  
  // State management
  const [allowedRecipients, setAllowedRecipients] = useState<AllowedRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [bulkPhoneNumbers, setBulkPhoneNumbers] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  // Load allowed recipients on component mount
  useEffect(() => {
    loadAllowedRecipients();
  }, []);

  const loadAllowedRecipients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/whatsapp/allowed-recipients');
      
      if (response.data.success) {
        const recipients = response.data.recipients.map((recipient: any) => ({
          phoneNumber: recipient.phoneNumber,
          formatted: recipient.formatted || formatPhoneNumber(recipient.phoneNumber),
          addedDate: recipient.addedDate,
          addedBy: recipient.addedBy || 'System'
        }));
        setAllowedRecipients(recipients);
        toast.success(`Loaded ${recipients.length} allowed recipients`);
      } else {
        toast.error(response.data.error || 'Failed to load allowed recipients');
      }
    } catch (error: any) {
      console.error('Error loading allowed recipients:', error);
      toast.error(error.response?.data?.error || 'Failed to load allowed recipients');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display (add + if not present)
    return phone.startsWith('+') ? phone : `+${phone}`;
  };

  const validatePhoneNumber = (phone: string) => {
    // Basic phone number validation
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  };

  const addSingleRecipient = async () => {
    if (!newPhoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    if (!validatePhoneNumber(newPhoneNumber)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/whatsapp/allowed-recipients/add', {
        phoneNumber: newPhoneNumber.trim()
      });

      if (response.data.success) {
        toast.success('Phone number added to allowed list');
        setNewPhoneNumber('');
        setShowAddDialog(false);
        loadAllowedRecipients();
      } else {
        toast.error(response.data.error || 'Failed to add phone number');
      }
    } catch (error: any) {
      console.error('Error adding recipient:', error);
      toast.error(error.response?.data?.error || 'Failed to add phone number');
    } finally {
      setLoading(false);
    }
  };

  const addBulkRecipients = async () => {
    const phoneNumbers = bulkPhoneNumbers
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (phoneNumbers.length === 0) {
      toast.error('Please enter at least one phone number');
      return;
    }

    // Validate all phone numbers
    const invalidNumbers = phoneNumbers.filter(num => !validatePhoneNumber(num));
    if (invalidNumbers.length > 0) {
      toast.error(`Invalid phone numbers found: ${invalidNumbers.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/whatsapp/allowed-recipients/add-multiple', {
        phoneNumbers
      });

      if (response.data.success) {
        toast.success(`Added ${response.data.count} phone numbers to allowed list`);
        setBulkPhoneNumbers('');
        setShowBulkAdd(false);
        loadAllowedRecipients();
      } else {
        toast.error(response.data.error || 'Failed to add phone numbers');
      }
    } catch (error: any) {
      console.error('Error adding bulk recipients:', error);
      toast.error(error.response?.data?.error || 'Failed to add phone numbers');
    } finally {
      setLoading(false);
    }
  };

  const removeSingleRecipient = async (phoneNumber: string) => {
    if (!confirm('Are you sure you want to remove this phone number from the allowed list?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/whatsapp/allowed-recipients/remove', {
        phoneNumber
      });

      if (response.data.success) {
        toast.success('Phone number removed from allowed list');
        loadAllowedRecipients();
      } else {
        toast.error(response.data.error || 'Failed to remove phone number');
      }
    } catch (error: any) {
      console.error('Error removing recipient:', error);
      toast.error(error.response?.data?.error || 'Failed to remove phone number');
    } finally {
      setLoading(false);
    }
  };

  const removeSelectedRecipients = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('Please select recipients to remove');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${selectedRecipients.length} phone numbers from the allowed list?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/whatsapp/allowed-recipients/remove-multiple', {
        phoneNumbers: selectedRecipients
      });

      if (response.data.success) {
        toast.success(`Removed ${response.data.count} phone numbers from allowed list`);
        setSelectedRecipients([]);
        loadAllowedRecipients();
      } else {
        toast.error(response.data.error || 'Failed to remove phone numbers');
      }
    } catch (error: any) {
      console.error('Error removing bulk recipients:', error);
      toast.error(error.response?.data?.error || 'Failed to remove phone numbers');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecipient = (phoneNumber: string) => {
    setSelectedRecipients(prev => 
      prev.includes(phoneNumber) 
        ? prev.filter(p => p !== phoneNumber)
        : [...prev, phoneNumber]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecipients.length === filteredRecipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(filteredRecipients.map(r => r.phoneNumber));
    }
  };

  const exportAllowedList = () => {
    const csvContent = [
      'Phone Number,Formatted,Added Date',
      ...allowedRecipients.map(r => `${r.phoneNumber},${r.formatted},${r.addedDate || 'Unknown'}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp-allowed-recipients.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Allowed recipients list exported');
  };

  // Filter recipients based on search term
  const filteredRecipients = allowedRecipients.filter(recipient =>
    recipient.formatted.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipient.phoneNumber.includes(searchTerm)
  );

  const summaryItems = [
    {
      title: 'Total Allowed Recipients',
      value: allowedRecipients.length,
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        activePage={activePage} 
        onNavigate={navigate}
        onLogout={logout}
        userName={user?.name}
        userRole={user?.role}
      />
      
      <div className="ml-23">
        <Header 
          title="WhatsApp Allowed Recipients"
          subtitle="Manage phone numbers that are allowed to receive WhatsApp messages through your business account."
        />
        
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Allowed Recipients</h1>
            <p className="text-gray-600">
              Manage phone numbers that are allowed to receive WhatsApp messages through your business account.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Single Number
            </button>
            
            <button
              onClick={() => setShowBulkAdd(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Multiple Numbers
            </button>
            
            <button
              onClick={exportAllowedList}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export List
            </button>
            
            <button
              onClick={loadAllowedRecipients}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {selectedRecipients.length > 0 && (
              <button
                onClick={removeSelectedRecipients}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Selected ({selectedRecipients.length})
              </button>
            )}
          </div>

          {/* Search and Stats */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search phone numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                Total: {allowedRecipients.length}
              </span>
              <span className="flex items-center">
                <Search className="h-4 w-4 mr-1 text-blue-500" />
                Showing: {filteredRecipients.length}
              </span>
            </div>
          </div>

          {/* Recipients Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading && allowedRecipients.length === 0 ? (
              <div className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600">Loading allowed recipients...</p>
              </div>
            ) : filteredRecipients.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  {searchTerm ? 'No recipients found matching your search.' : 'No allowed recipients found.'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedRecipients.length === filteredRecipients.length && filteredRecipients.length > 0}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRecipients.map((recipient, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedRecipients.includes(recipient.phoneNumber)}
                              onChange={() => handleSelectRecipient(recipient.phoneNumber)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {recipient.formatted}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Allowed
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => removeSingleRecipient(recipient.phoneNumber)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Single Number Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Phone Number</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+919876543210"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +91 for India)
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setNewPhoneNumber('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addSingleRecipient}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Number'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Dialog */}
      {showBulkAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Add Multiple Phone Numbers</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Numbers (one per line)
              </label>
              <textarea
                placeholder="+919876543210&#10;+919876543211&#10;+919876543212"
                value={bulkPhoneNumbers}
                onChange={(e) => setBulkPhoneNumbers(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter one phone number per line. Include country code (e.g., +91 for India)
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBulkAdd(false);
                  setBulkPhoneNumbers('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addBulkRecipients}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Numbers'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CommonFeatures 
        summaryItems={summaryItems}
        onExportCSV={exportAllowedList}
        onExportPDF={exportAllowedList}
        showExportBlock={false}
      >
        <div className="space-y-8">
          {/* Recipients Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading && allowedRecipients.length === 0 ? (
              <div className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600">Loading allowed recipients...</p>
              </div>
            ) : filteredRecipients.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  {searchTerm ? 'No recipients found matching your search.' : 'No allowed recipients found.'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedRecipients.length === filteredRecipients.length && filteredRecipients.length > 0}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRecipients.map((recipient, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedRecipients.includes(recipient.phoneNumber)}
                              onChange={() => handleSelectRecipient(recipient.phoneNumber)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {recipient.formatted}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Allowed
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => removeSingleRecipient(recipient.phoneNumber)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </CommonFeatures>
    </div>
  );
};

export default WhatsAppManagement;
