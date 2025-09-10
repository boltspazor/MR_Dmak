import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Edit, 
  Trash2, 
  Search, 
  Code,
  Type,
  Eye,
  Copy
} from 'lucide-react';
import { api } from '../lib/api';
import { Template } from '../types';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import { useAuth } from '../contexts/AuthContext';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
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


  useEffect(() => {
    fetchTemplates();
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const templateData = {
        ...formData,
        parameters: formData.parameters
      };

      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate.name}`, templateData);
      } else {
        await api.post('/templates', templateData);
      }

      await fetchTemplates();
      setShowCreateForm(false);
      setEditingTemplate(null);
      setFormData({
        name: '',
        content: '',
        type: 'text',
        imageUrl: '',
        parameters: []
      });
    } catch (error: any) {
      console.error('Error saving template:', error);
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await api.delete(`/templates/${id}`);
      await fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
    }
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
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
            {/* Template Management Header */}
            <h2 className="text-2xl font-bold text-gray-900">Template Management</h2>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
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

            {/* Templates Table */}
            <div className="bg-white bg-opacity-40 rounded-lg">
              {/* Table Header */}
              <div className="p-6 border-b bg-indigo-50">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">All Templates</h2>
                  <span className="text-sm text-gray-700 font-bold">
                    {filteredTemplates.length} Templates
                  </span>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border-0 bg-gray-100"
                    />
                  </div>
                  
                  <div className="relative">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-0 bg-gray-100"
                    >
                      <option value="">All Types</option>
                      <option value="text">Text</option>
                      <option value="html">HTML</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-indigo-50 border-b">
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Name</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Type</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Parameters</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Content</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Created</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((template, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">{template.name}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {template.type}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            {template.parameters.length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {template.parameters.slice(0, 2).map((param, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    #{param}
                                  </span>
                                ))}
                                {template.parameters.length > 2 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    +{template.parameters.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            <div className="max-w-xs truncate">
                              {template.content.substring(0, 50)}...
                            </div>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-6 text-sm text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handlePreview(template)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Preview Template"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(template)}
                                className="text-green-600 hover:text-green-800"
                                title="Edit Template"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => duplicateTemplate(template)}
                                className="text-purple-600 hover:text-purple-800"
                                title="Duplicate Template"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(template.name)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete Template"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                              <FileText className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-indigo-600">
                              No Templates Found
                            </h3>
                            <p className="text-sm text-indigo-600">
                              Get started by creating your first template
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
            <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'html' | 'text' | 'image'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="text">Text</option>
                    <option value="html">HTML</option>
                    <option value="image">Image</option>
                  </select>
                </div>

                {formData.type === 'image' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter image URL"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Content *
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter template content..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use #ParameterName for dynamic parameters (e.g., #FirstName, #LastName, #MRId)
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingTemplate(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Template Preview
                </h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
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
                      <pre className="whitespace-pre-wrap text-sm">
                        {previewTemplate.content}
                      </pre>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Parameters:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.parameters.map((param, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
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
