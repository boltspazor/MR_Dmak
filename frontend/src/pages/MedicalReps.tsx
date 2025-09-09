import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircle, 
  Edit, 
  Trash2, 
  Search, 
  Download,
  Users,
  BarChart3,
  Activity,
  LogOut,
  Shield,
  FileText,
  MessageSquare
} from 'lucide-react';
import { api } from '../lib/api';
import { MedicalRepresentative, Group } from '../types';
import Sidebar from '../components/Sidebar';

const MedicalReps: React.FC = () => {
  const navigate = useNavigate();
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

  // Navigation functions
  const handleSidebarNavigation = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#ECEAE2', width: '1440px', height: '1024px' }}>
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
        activePage="mrs"
        onNavigate={handleSidebarNavigation}
        onLogout={handleLogout}
        userName="Marketing Manager"
      />

      {/* Main Content */}
      <div className="ml-24 p-8">
        {/* Header */}
        <div className="relative mb-8" style={{ marginBottom: '32px' }}>
          <div className="flex justify-between items-start">
            <div style={{ marginLeft: '100px' }}>
              <h1 className="text-3xl font-bold text-black mb-2" style={{ 
                fontFamily: 'Jura', 
                fontSize: '32px', 
                lineHeight: '38px',
                fontWeight: 700,
                marginBottom: '8px'
              }}>Medical Representatives</h1>
              <p className="text-lg text-black" style={{ 
                fontFamily: 'Jura', 
                fontSize: '18.36px',
                lineHeight: '22px',
                fontWeight: 500,
                letterSpacing: '0.08em'
              }}>
                Manage your medical representative contacts
              </p>
            </div>
            
            {/* Glenmark Logo */}
            <div className="absolute top-0 right-0" style={{ right: '102px' }}>
              <img 
                src="/glenmark-simple.svg" 
                alt="Glenmark" 
                style={{ width: '140px', height: '79px' }}
              />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6" style={{ marginTop: '24px', marginLeft: '100px' }}>
            <button
              onClick={() => setShowUploadForm(true)}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ 
                background: '#1E1E1E', 
                fontFamily: 'Jura',
                fontSize: '13.51px',
                lineHeight: '16px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                padding: '10px 16px',
                borderRadius: '10px'
              }}
            >
              Bulk Upload
            </button>
            <button
              onClick={exportMRsToCSV}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ 
                background: '#1E1E1E', 
                fontFamily: 'Jura',
                fontSize: '13.51px',
                lineHeight: '16px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                padding: '10px 16px',
                borderRadius: '10px'
              }}
            >
              Export
            </button>
            <button
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
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ 
                background: '#2C2696', 
                fontFamily: 'Jura',
                fontSize: '13.51px',
                lineHeight: '16px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                padding: '10px 16px',
                borderRadius: '10px'
              }}
            >
              Add MR
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative" style={{ width: '1308px', height: '935px', marginLeft: '100px' }}>
          {/* Background with blur effect */}
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(120.66deg, rgba(255, 255, 255, 0.4) 7.56%, rgba(255, 255, 255, 0.1) 93.23%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '15px',
              width: '1308px',
              height: '935px'
            }}
          />
          
          {/* Content */}
          <div className="relative" style={{ padding: '24px' }}>
        {/* Statistics Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8" style={{ gap: '24px', marginBottom: '32px' }}>
              {/* Total MRs */}
              <div className="bg-white rounded-lg p-6" style={{ 
                background: 'rgba(44, 38, 150, 0.1)', 
                borderRadius: '10px',
                width: '255px',
                height: '161px',
                padding: '24px',
                border: '1px solid #000000'
              }}>
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-6xl font-bold text-black mb-2" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '64px',
                    lineHeight: '76px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>{mrs.length}</p>
                  <h3 className="text-lg font-bold text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18px',
                    lineHeight: '21px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>Total MRs</h3>
                </div>
              </div>

              {/* Active Groups */}
              <div className="bg-white rounded-lg p-6" style={{ 
                background: 'rgba(44, 38, 150, 0.15)', 
                borderRadius: '10px',
                width: '255px',
                height: '161px',
                padding: '24px',
                border: '1px solid #000000'
              }}>
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-6xl font-bold text-black mb-2" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '64px',
                    lineHeight: '76px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>{new Set(mrs.map(mr => mr.groupId)).size}</p>
                  <h3 className="text-lg font-bold text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18px',
                    lineHeight: '21px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>Active Groups</h3>
                </div>
              </div>

              {/* With Phone */}
              <div className="bg-white rounded-lg p-6" style={{ 
                background: 'rgba(44, 38, 150, 0.2)', 
                borderRadius: '10px',
                width: '255px',
                height: '161px',
                padding: '24px',
                border: '1px solid #000000'
              }}>
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-6xl font-bold text-black mb-2" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '64px',
                    lineHeight: '76px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>{mrs.filter(mr => mr.phone).length}</p>
                  <h3 className="text-lg font-bold text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18px',
                    lineHeight: '21px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>With Phone</h3>
                </div>
              </div>

              {/* With Email */}
              <div className="bg-white rounded-lg p-6" style={{ 
                background: 'rgba(44, 38, 150, 0.25)', 
                borderRadius: '10px',
                width: '255px',
                height: '161px',
                padding: '24px',
                border: '1px solid #000000'
              }}>
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-6xl font-bold text-black mb-2" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '64px',
                    lineHeight: '76px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>{mrs.filter(mr => mr.email).length}</p>
                  <h3 className="text-lg font-bold text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18px',
                    lineHeight: '21px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>With Email</h3>
                </div>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="flex items-center justify-between mb-6" style={{ marginBottom: '24px' }}>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search MRs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border-0"
                  style={{ 
                    background: '#F2F2F2',
                    borderRadius: '10px',
                    height: '44px',
                    padding: '12px 16px',
                    width: '825px'
                  }}
                />
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ 
                    background: '#1E1E1E', 
                    fontFamily: 'Jura',
                    fontSize: '13.51px',
                    lineHeight: '16px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    height: '36px'
                  }}
                >
                  <option value="">All Groups</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.groupName}</option>
                  ))}
                </select>
                <span className="text-sm text-black font-bold" style={{ 
                  fontFamily: 'Jura',
                  fontSize: '13.51px',
                  lineHeight: '16px',
                  fontWeight: 600,
                  letterSpacing: '0.08em'
                }}>
                  {filteredMRs.length} MRs
                </span>
              </div>
                </div>

            {/* MRs Table */}
            <div className="bg-white rounded-lg" style={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              width: '1110px',
              height: '498px',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
            }}>
              {/* Table Header */}
              <div className="p-6 border-b" style={{ 
                background: 'rgba(215, 181, 109, 0.1)',
                borderRadius: '10px 10px 0px 0px',
                padding: '24px',
                height: '53px'
              }}>
                <div className="grid grid-cols-6 gap-4 text-center">
                  <div className="text-sm font-medium text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '14px',
                    lineHeight: '17px',
                    fontWeight: 300
                  }}>MR ID</div>
                  <div className="text-sm font-medium text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '14px',
                    lineHeight: '17px',
                    fontWeight: 300
                  }}>Name</div>
                  <div className="text-sm font-medium text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '14px',
                    lineHeight: '17px',
                    fontWeight: 300
                  }}>Phone No.</div>
                  <div className="text-sm font-medium text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '14px',
                    lineHeight: '17px',
                    fontWeight: 300
                  }}>Group</div>
                  <div className="text-sm font-medium text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '14px',
                    lineHeight: '17px',
                    fontWeight: 300
                  }}>Comments</div>
                  <div className="text-sm font-medium text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '14px',
                    lineHeight: '17px',
                    fontWeight: 300
                  }}>Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="p-6" style={{ padding: '24px' }}>
                {filteredMRs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredMRs.map(mr => (
                      <div key={mr.id} className="grid grid-cols-6 gap-4 items-center py-3 border-b border-gray-200 last:border-b-0">
                        <div className="text-sm text-black text-center" style={{ fontFamily: 'Jura' }}>
                          {mr.mrId}
                        </div>
                        <div className="text-sm text-black text-center" style={{ fontFamily: 'Jura' }}>
                          {mr.firstName} {mr.lastName}
                        </div>
                        <div className="text-sm text-black text-center" style={{ fontFamily: 'Jura' }}>
                          {mr.phone}
                        </div>
                        <div className="text-sm text-black text-center" style={{ fontFamily: 'Jura' }}>
                          {mr.group?.groupName || 'No Group'}
                        </div>
                        <div className="text-sm text-black text-center" style={{ fontFamily: 'Jura' }}>
                          {mr.comments || '-'}
                        </div>
                        <div className="text-sm text-center">
                          <div className="flex justify-center space-x-2">
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserCircle className="h-12 w-12 text-gray-400" />
                </div>
                    <h3 className="text-lg font-bold text-black mb-2" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '18.36px',
                      lineHeight: '22px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: 'rgba(0, 0, 0, 0.5)'
                    }}>
                      No Medical Representatives Found
                    </h3>
                    <p className="text-sm text-black mb-4" style={{ 
                      fontFamily: 'Jura',
                      fontSize: '10px',
                      lineHeight: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: 'rgba(0, 0, 0, 0.5)'
                    }}>
                      Add your first Medical Representative to get started...
                    </p>
                    <button
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
                      className="px-6 py-3 rounded-lg text-white text-sm font-semibold"
                      style={{ 
                        background: '#2C2696', 
                        fontFamily: 'Jura',
                        fontSize: '13.51px',
                        lineHeight: '16px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        padding: '10px 16px',
                        borderRadius: '10px'
                      }}
                    >
                      Add First MR
                    </button>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>

      {/* Create/Edit Form Modal */}
        {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-black mb-4" style={{ fontFamily: 'Jura' }}>
                {editingMR ? 'Edit Medical Representative' : 'Add New Medical Representative'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                  <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
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
                  <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
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
                  <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
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
                  <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
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
                  <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
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
                  <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
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
                <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
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
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ 
                    background: '#2C2696', 
                    fontFamily: 'Jura'
                  }}
                >
                    {editingMR ? 'Update MR' : 'Add MR'}
                </button>
                <button
                    type="button"
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
                  className="px-4 py-2 rounded-lg text-gray-700 text-sm font-semibold border border-gray-300"
                  style={{ fontFamily: 'Jura' }}
                  >
                    Cancel
                </button>
                </div>
              </form>
          </div>
        </div>
        )}

      {/* Bulk Upload Form Modal */}
        {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-black mb-4" style={{ fontFamily: 'Jura' }}>
              Bulk Upload Medical Representatives
            </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                <button
                    onClick={() => downloadTemplate('excel')}
                  className="px-4 py-2 rounded-lg text-gray-700 text-sm font-semibold border border-gray-300"
                  style={{ fontFamily: 'Jura' }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel Template
                </button>
                <button
                    onClick={() => downloadTemplate('csv')}
                  className="px-4 py-2 rounded-lg text-gray-700 text-sm font-semibold border border-gray-300"
                  style={{ fontFamily: 'Jura' }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                </button>
                </div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Jura' }}>
                  Upload an Excel file (.xlsx, .xls) or CSV file. Make sure to follow the template format.
                </p>
                <div className="flex space-x-3">
                <button
                    onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 text-sm font-semibold border border-gray-300"
                  style={{ fontFamily: 'Jura' }}
                  >
                    Close
                </button>
              </div>
            </div>
          </div>
              </div>
            )}
          </div>
  );
};

export default MedicalReps;
