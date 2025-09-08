import React, { useState, useEffect } from 'react';
import { 
  UserCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Download,
  Upload,
  Users,
  Phone,
  Mail,
  Calendar,
  Filter
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { api } from '../lib/api';
import { MedicalRepresentative, Group } from '../types';

const MedicalReps: React.FC = () => {
  const [mrs, setMrs] = useState<MedicalRepresentative[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMR, setEditingMR] = useState<MedicalRepresentative | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

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
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get('/groups');
      setGroups(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      if (editingMR) {
        await api.put(`/mrs/${editingMR.id}`, formData);
      } else {
        await api.post('/mrs', formData);
      }

      setFormData({
        mrId: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        groupId: '',
        comments: ''
      });
      setEditingMR(null);
      setShowCreateForm(false);
      fetchMRs();
    } catch (error: any) {
      console.error('Error saving MR:', error);
      alert(error.response?.data?.error || 'Failed to save MR');
    }
  };

  const handleDelete = async (mrId: string) => {
    if (!window.confirm('Are you sure you want to delete this Medical Representative?')) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await api.delete(`/mrs/${mrId}`);
      fetchMRs();
    } catch (error: any) {
      console.error('Error deleting MR:', error);
      alert(error.response?.data?.error || 'Failed to delete MR');
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
    setShowCreateForm(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.post('/mrs/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const { created, errors, totalProcessed, success } = response.data;
      
      if (success) {
        let message = `Bulk upload completed!\n\nCreated: ${created} MRs\nTotal Processed: ${totalProcessed}`;
        if (errors && errors.length > 0) {
          message += `\n\nErrors (${errors.length}):\n${errors.slice(0, 5).join('\n')}`;
          if (errors.length > 5) {
            message += `\n... and ${errors.length - 5} more errors`;
          }
        }
        alert(message);
        fetchMRs();
        setShowUploadForm(false);
      } else {
        alert(`Upload failed. Errors:\n${errors.join('\n')}`);
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(error.response?.data?.error || 'Failed to upload file');
    }
  };

  const downloadTemplate = async (format: 'excel' | 'csv' = 'excel') => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const endpoint = format === 'csv' ? '/mrs/template/csv' : '/mrs/template';
      const response = await api.get(endpoint, {
        responseType: format === 'csv' ? 'text' : 'blob'
      });

      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mr_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mr_template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      }
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

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-32 border border-gray-200"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical Representatives</h1>
            <p className="text-gray-600">Manage your medical representative contacts</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowUploadForm(true)}
              variant="outline"
              className="flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button
              onClick={exportMRsToCSV}
              variant="outline"
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => {
                setShowCreateForm(true);
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
              }}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add MR
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <UserCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total MRs</p>
                  <p className="text-2xl font-semibold text-gray-900">{mrs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Groups</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {new Set(mrs.map(mr => mr.groupId)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <Phone className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">With Phone</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {mrs.filter(mr => mr.phone).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">With Email</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {mrs.filter(mr => mr.email).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingMR ? 'Edit Medical Representative' : 'Add New Medical Representative'}
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MR ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.mrId}
                      onChange={(e) => setFormData({...formData, mrId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter MR ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group *
                    </label>
                    <select
                      required
                      value={formData.groupId}
                      onChange={(e) => setFormData({...formData, groupId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.groupName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments
                  </label>
                  <textarea
                    value={formData.comments}
                    onChange={(e) => setFormData({...formData, comments: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter any additional comments"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button type="submit">
                    {editingMR ? 'Update MR' : 'Add MR'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
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
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Bulk Upload Form */}
        {showUploadForm && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Bulk Upload Medical Representatives</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <Button
                    onClick={() => downloadTemplate('excel')}
                    variant="outline"
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel Template
                  </Button>
                  <Button
                    onClick={() => downloadTemplate('csv')}
                    variant="outline"
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Upload an Excel file (.xlsx, .xls) or CSV file. Make sure to follow the template format.
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setShowUploadForm(false)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search MRs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Groups</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.groupName}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500">{filteredMRs.length} MRs</span>
          </div>
        </div>

        {/* MRs Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MR ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMRs.map(mr => (
                  <tr key={mr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {mr.mrId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {mr.firstName} {mr.lastName}
                        </div>
                        {mr.comments && (
                          <div className="text-sm text-gray-500">{mr.comments}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {mr.phone}
                        </div>
                        {mr.email && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {mr.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {mr.group?.groupName || 'No Group'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(mr.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(mr)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mr.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMRs.length === 0 && (
              <div className="text-center py-12">
                <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No medical representatives found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm || selectedGroup ? 'Try adjusting your search terms or filters' : 'Add your first MR to get started'}
                </p>
                {!searchTerm && !selectedGroup && (
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First MR
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default MedicalReps;
