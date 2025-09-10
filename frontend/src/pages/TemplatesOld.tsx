import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Edit, 
  Trash2, 
  Search, 
  Download,
  Plus,
  Image,
  Code,
  Type,
  BarChart3,
  Activity,
  LogOut,
  Shield,
  MessageSquare,
  Users,
  Eye,
  Copy,
  Upload
} from 'lucide-react';
import { api } from '../lib/api';
import { Template, TemplateStats } from '../types';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import { useAuth } from '../contexts/AuthContext';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    type: 'text' as 'html' | 'text' | 'image',
    imageUrl: '',
    parameters: [] as string[]
  });

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchStats();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get('/templates');
      setTemplates(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get('/templates/stats');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Error fetching template stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate._id}`, formData);
      } else {
        await api.post('/templates', formData);
      }

      setFormData({
        name: '',
        content: '',
        type: 'text',
        imageUrl: '',
        parameters: []
      });
      setEditingTemplate(null);
      setShowCreateForm(false);
      fetchTemplates();
      fetchStats();
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(error.response?.data?.error || 'Failed to save template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await api.delete(`/templates/${templateId}`);
      fetchTemplates();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      alert(error.response?.data?.error || 'Failed to delete template');
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      type: template.type,
      imageUrl: template.imageUrl || '',
      parameters: template.parameters
    });
    setShowCreateForm(true);
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/templates/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({
        ...prev,
        imageUrl: response.data.data.imageUrl
      }));
      setImagePreview(response.data.data.imageUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const exportTemplates = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get('/templates/export', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'templates.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error exporting templates:', error);
      alert('Failed to export templates');
    }
  };

  const duplicateTemplate = async (template: Template) => {
    const newName = `${template.name} (Copy)`;
    setFormData({
      name: newName,
      content: template.content,
      type: template.type,
      imageUrl: template.imageUrl || '',
      parameters: template.parameters
    });
    setShowCreateForm(true);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.parameters.some(param => param.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !selectedType || template.type === selectedType;
    
    return matchesSearch && matchesType;
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

  const exportTemplatesToCSV = () => {
    const csvContent = [
      'Name,Type,Parameters,Content,Created At',
      ...templates.map(template => 
        `${template.name},${template.type},${template.parameters.join(';')},${template.content.replace(/,/g, ';')},${new Date(template.createdAt).toLocaleDateString()}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'templates.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportTemplatesToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableContent = `
        <html>
          <head>
            <title>Templates Report</title>
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
            <h1>Templates Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Parameters</th>
                  <th>Content</th>
                </tr>
              </thead>
              <tbody>
                ${templates.map(template => `
                  <tr>
                    <td>${template.name}</td>
                    <td>${template.type}</td>
                    <td>${template.parameters.join(', ')}</td>
                    <td>${template.content.substring(0, 100)}...</td>
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

  const summaryItems = [
    {
      title: 'Total Templates',
      value: templates.length,
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'HTML Templates',
      value: templates.filter(t => t.type === 'html').length,
      icon: <Code className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100'
    },
    {
      title: 'Text Templates',
      value: templates.filter(t => t.type === 'text').length,
      icon: <Type className="h-6 w-6 text-orange-600" />,
      color: 'bg-orange-100'
    }
  ];

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
        activePage="templates"
        onNavigate={handleSidebarNavigation}
        onLogout={handleLogout}
        userName={user?.name || "User"}
      />

      {/* Main Content */}
      <div className="ml-24 p-8">
        {/* Header */}
        <Header 
          title="Template Management"
          subtitle="Create and manage message templates with dynamic parameters"
          onExportCSV={exportTemplatesToCSV}
          onExportPDF={exportTemplatesToPDF}
          showExportButtons={false}
        />
        
        {/* Separator Line */}
        <div className="border-b border-gray-300 my-6"></div>
        {/* Main Content Area */}
        <CommonFeatures
          summaryItems={summaryItems}
          onExportCSV={exportTemplatesToCSV}
          onExportPDF={exportTemplatesToPDF}
        >
          <div className="space-y-8">
            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Template Management</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowCreateForm(true);
                    setEditingTemplate(null);
                    setFormData({
                      name: '',
                      content: '',
                      type: 'text',
                      imageUrl: '',
                      parameters: []
                    });
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                >
                  Create Template
                </button>
              </div>
            </div>
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
              {/* Total Templates */}
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
                  }}>{stats?.totalTemplates || 0}</p>
                  <h3 className="text-lg font-bold text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18px',
                    lineHeight: '21px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>Total Templates</h3>
                </div>
              </div>

              {/* Text Templates */}
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
                  }}>{stats?.textTemplates || 0}</p>
                  <h3 className="text-lg font-bold text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18px',
                    lineHeight: '21px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>Text Templates</h3>
                </div>
              </div>

              {/* HTML Templates */}
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
                  }}>{stats?.htmlTemplates || 0}</p>
                  <h3 className="text-lg font-bold text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18px',
                    lineHeight: '21px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>HTML Templates</h3>
                </div>
              </div>

              {/* Image Templates */}
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
                  }}>{stats?.imageTemplates || 0}</p>
                  <h3 className="text-lg font-bold text-black" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18px',
                    lineHeight: '21px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}>Image Templates</h3>
                </div>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="flex items-center justify-between mb-6" style={{ marginBottom: '24px' }}>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
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
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
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
                  <option value="">All Types</option>
                  <option value="text">Text</option>
                  <option value="html">HTML</option>
                  <option value="image">Image</option>
                </select>
                <span className="text-sm text-black font-bold" style={{ 
                  fontFamily: 'Jura',
                  fontSize: '13.51px',
                  lineHeight: '16px',
                  fontWeight: 600,
                  letterSpacing: '0.08em'
                }}>
                  {filteredTemplates.length} Templates
                </span>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gap: '24px' }}>
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map(template => (
                  <div key={template._id} className="bg-white rounded-lg p-6" style={{ 
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                    height: '300px'
                  }}>
                    {/* Template Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {template.type === 'text' && <Type className="h-5 w-5 text-blue-600" />}
                        {template.type === 'html' && <Code className="h-5 w-5 text-green-600" />}
                        {template.type === 'image' && <Image className="h-5 w-5 text-purple-600" />}
                        <h3 className="text-lg font-bold text-black" style={{ 
                          fontFamily: 'Jura',
                          fontSize: '18px',
                          lineHeight: '21px',
                          fontWeight: 700
                        }}>{template.name}</h3>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handlePreview(template)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => duplicateTemplate(template)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(template)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(template._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Template Content Preview */}
                    <div className="mb-4" style={{ height: '120px', overflow: 'hidden' }}>
                      {template.type === 'image' && template.imageUrl ? (
                        <img 
                          src={template.imageUrl} 
                          alt={template.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <p className="text-sm text-gray-600" style={{ 
                          fontFamily: 'Jura',
                          fontSize: '14px',
                          lineHeight: '17px'
                        }}>
                          {template.content.length > 150 
                            ? template.content.substring(0, 150) + '...' 
                            : template.content
                          }
                        </p>
                      )}
                    </div>

                    {/* Template Parameters */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {template.parameters.slice(0, 3).map((param, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            style={{ fontFamily: 'Jura' }}
                          >
                            #{param}
                          </span>
                        ))}
                        {template.parameters.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded" style={{ fontFamily: 'Jura' }}>
                            +{template.parameters.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Template Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500" style={{ fontFamily: 'Jura' }}>
                      <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                      <span className="capitalize">{template.type}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '18.36px',
                    lineHeight: '22px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'rgba(0, 0, 0, 0.5)'
                  }}>
                    No Templates Found
                  </h3>
                  <p className="text-sm text-black mb-4" style={{ 
                    fontFamily: 'Jura',
                    fontSize: '10px',
                    lineHeight: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'rgba(0, 0, 0, 0.5)'
                  }}>
                    Create your first template to get started...
                  </p>
                  <button
                    onClick={() => {
                      setShowCreateForm(true);
                      setEditingTemplate(null);
                      setFormData({
                        name: '',
                        content: '',
                        type: 'text',
                        imageUrl: '',
                        parameters: []
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
                    Create First Template
                  </button>
                </div>
              )}
            </div>
          </div>
        </CommonFeatures>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-black mb-4" style={{ fontFamily: 'Jura' }}>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
                  Template Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'html' | 'text' | 'image'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="html">HTML</option>
                  <option value="image">Image</option>
                </select>
              </div>

              {formData.type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="mt-2 w-full h-32 object-cover rounded"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-black mb-1" style={{ fontFamily: 'Jura' }}>
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template content. Use #ParameterName for dynamic parameters (e.g., #FirstName, #LastName)"
                />
                <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Jura' }}>
                  Use #ParameterName for dynamic parameters (e.g., #FirstName, #LastName, #MRId)
                </p>
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
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTemplate(null);
                    setFormData({
                      name: '',
                      content: '',
                      type: 'text',
                      imageUrl: '',
                      parameters: []
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

      {/* Preview Modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black" style={{ fontFamily: 'Jura' }}>
                Template Preview
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-black mb-2" style={{ fontFamily: 'Jura' }}>
                  {previewTemplate.name}
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {previewTemplate.type === 'image' && previewTemplate.imageUrl ? (
                    <img 
                      src={previewTemplate.imageUrl} 
                      alt={previewTemplate.name}
                      className="w-full h-48 object-cover rounded"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm" style={{ fontFamily: 'Jura' }}>
                      {previewTemplate.content}
                    </pre>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-black mb-2" style={{ fontFamily: 'Jura' }}>
                  Parameters:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.parameters.map((param, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      style={{ fontFamily: 'Jura' }}
                    >
                      #{param}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Templates;
