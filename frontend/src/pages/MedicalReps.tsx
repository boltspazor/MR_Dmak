import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircle, 
  Edit, 
  Trash2, 
  Search, 
  Download,
  Users,
  FileText,
  BarChart3
} from 'lucide-react';
import { api } from '../lib/api';
import { MedicalRepresentative, Group } from '../types';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import { useAuth } from '../contexts/AuthContext';

const MedicalReps: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mrs, setMrs] = useState<MedicalRepresentative[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMR, setEditingMR] = useState<MedicalRepresentative | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    mrId: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    groupId: '',
    comments: ''
  });

  useEffect(() => {
    fetchMRs();
    fetchGroups();
  }, []);

  const fetchMRs = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get('/mrs');
      setMrs(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching MRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      await api.post('/mrs', formData);
      await fetchMRs();
      setShowCreateForm(false);
      setFormData({
        mrId: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        groupId: '',
        comments: ''
      });
      setError(null);
    } catch (error: any) {
      console.error('Error creating MR:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create MR. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (mr: MedicalRepresentative) => {
    setEditingMR(mr);
    setFormData({
      mrId: mr.mrId,
      firstName: mr.firstName,
      lastName: mr.lastName,
      phone: mr.phone,
      email: mr.email || '',
      groupId: mr.groupId,
      comments: mr.comments || ''
    });
    setError(null);
    setShowCreateForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMR) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      await api.put(`/mrs/${editingMR.id}`, formData);
      await fetchMRs();
      setShowCreateForm(false);
      setEditingMR(null);
      setFormData({
        mrId: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        groupId: '',
        comments: ''
      });
      setError(null);
    } catch (error: any) {
      console.error('Error updating MR:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update MR. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this MR?')) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await api.delete(`/mrs/${id}`);
      await fetchMRs();
    } catch (error: any) {
      console.error('Error deleting MR:', error);
    }
  };

  const downloadTemplate = async (format: 'excel' | 'csv') => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get(`/mrs/template?format=${format}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mr_template.${format === 'excel' ? 'xlsx' : 'csv'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  const exportMRsToCSV = () => {
    const csvContent = [
      'MR ID,First Name,Last Name,Phone,Email,Group,Comments,Created At',
      ...mrs.map(mr => 
        `${mr.mrId},${mr.firstName},${mr.lastName},${mr.phone},${mr.email || ''},${mr.group?.groupName || ''},${mr.comments || ''},${new Date(mr.createdAt).toLocaleDateString()}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medical_representatives.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportMRsToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableContent = `
        <html>
          <head>
            <title>Medical Representatives Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <h1>Medical Representatives Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  <th>MR ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Group</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                ${mrs.map(mr => `
                  <tr>
                    <td>${mr.mrId}</td>
                    <td>${mr.firstName} ${mr.lastName}</td>
                    <td>${mr.phone}</td>
                    <td>${mr.email || '-'}</td>
                    <td>${mr.group?.groupName || '-'}</td>
                    <td>${mr.comments || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(tableContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filteredMRs = mrs.filter(mr => {
    const matchesSearch = 
      mr.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mr.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mr.mrId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mr.phone.includes(searchTerm) ||
      (mr.email && mr.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGroup = !selectedGroup || mr.groupId === selectedGroup;
    
    return matchesSearch && matchesGroup;
  });

  // Navigation functions
  const handleSidebarNavigation = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const summaryItems = [
    {
      title: 'Total MRs',
      value: mrs.length,
      icon: <Users className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'Total Groups',
      value: groups.length,
      icon: <FileText className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100'
    },
    {
      title: 'Active MRs',
      value: mrs.filter(mr => mr.group).length,
      icon: <BarChart3 className="h-6 w-6 text-orange-600" />,
      color: 'bg-orange-100'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-32 border border-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        activePage="dmak"
        onNavigate={handleSidebarNavigation}
        onLogout={handleLogout}
        userName={user?.name || "User"}
        userRole={user?.role || "Super Admin"}
      />

      {/* Main Content */}
      <div className="ml-24 p-8">
        {/* Header */}
        <Header 
          title="MR Management"
          subtitle="Manage your medical representative contacts"
          onExportCSV={exportMRsToCSV}
          onExportPDF={exportMRsToPDF}
          showExportButtons={false}
        />
        
        {/* Separator Line */}
        <div className="border-b border-gray-300 my-6"></div>

        {/* Main Content Area */}
        <CommonFeatures
          summaryItems={summaryItems}
          onExportCSV={exportMRsToCSV}
          onExportPDF={exportMRsToPDF}
        >
          <div className="space-y-8">
            {/* MR Management Header */}
            <h2 className="text-2xl font-bold text-gray-900">MR Management</h2>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                >
                  Bulk Upload
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(true);
                    setEditingMR(null);
                    setError(null);
                    setFormData({
                      mrId: '',
                      firstName: '',
                      lastName: '',
                      phone: '',
                      email: '',
                      groupId: '',
                      comments: ''
                    });
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                >
                  Add MR
                </button>
              </div>
            </div>

            {/* MRs Table */}
            <div className="bg-white bg-opacity-40 rounded-lg">
              {/* Table Header */}
              <div className="p-6 border-b bg-indigo-50">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">All MRs</h2>
                  <span className="text-sm text-gray-700 font-bold">
                    {filteredMRs.length} MRs
                  </span>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search MRs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border-0 bg-gray-100"
                    />
                  </div>
                  
                  <div className="relative">
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-0 bg-gray-100"
                    >
                      <option value="">All Groups</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.groupName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-indigo-50 border-b">
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">MR ID</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Name</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Phone</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Email</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Group</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Comments</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMRs.length > 0 ? (
                      filteredMRs.map(mr => (
                        <tr key={mr.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{mr.mrId}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            {mr.firstName} {mr.lastName}
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{mr.phone}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{mr.email || '-'}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{mr.group?.groupName || 'No Group'}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{mr.comments || '-'}</td>
                          <td className="py-3 px-6 text-sm text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleEdit(mr)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit MR"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(mr.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete MR"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                              <UserCircle className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-indigo-600">
                              No MRs Found
                            </h3>
                            <p className="text-sm text-indigo-600">
                              Get started by adding your first medical representative
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CommonFeatures>

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingMR ? 'Edit MR' : 'Add New MR'}
              </h2>
              
              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={editingMR ? handleUpdate : handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MR ID *</label>
                    <input
                      type="text"
                      value={formData.mrId}
                      onChange={(e) => setFormData({...formData, mrId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
                  <select
                    value={formData.groupId}
                    onChange={(e) => setFormData({...formData, groupId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select a group</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.groupName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                  <textarea
                    value={formData.comments}
                    onChange={(e) => setFormData({...formData, comments: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingMR(null);
                      setError(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-lg text-white font-medium ${
                      isSubmitting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {editingMR ? 'Updating...' : 'Adding...'}
                      </div>
                    ) : (
                      editingMR ? 'Update MR' : 'Add MR'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload Form Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Upload MRs</h2>
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <button
                    onClick={() => downloadTemplate('excel')}
                    className="px-4 py-2 rounded-lg text-gray-700 text-sm font-semibold border border-gray-300"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel Template
                  </button>
                  <button
                    onClick={() => downloadTemplate('csv')}
                    className="px-4 py-2 rounded-lg text-gray-700 text-sm font-semibold border border-gray-300"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Upload an Excel file (.xlsx, .xls) or CSV file. Make sure to follow the template format.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUploadForm(false)}
                    className="px-4 py-2 rounded-lg text-gray-700 text-sm font-semibold border border-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalReps;