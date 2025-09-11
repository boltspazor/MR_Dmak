import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Edit, 
  Trash2, 
  Search, 
  Eye,
  Copy,
  Upload,
  Download,
  X
} from 'lucide-react';
import { api } from '../lib/api';
import { Template, AvailableParameters } from '../types';
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
  const [sortField, setSortField] = useState<'name' | 'createdAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [availableParameters, setAvailableParameters] = useState<AvailableParameters | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    type: 'text' as 'html' | 'text' | 'image',
    imageUrl: '',
    footerImageUrl: '',
    parameters: [] as string[]
  });

  // File upload states
  const [headerImage, setHeaderImage] = useState<File | null>(null);
  const [footerImage, setFooterImage] = useState<File | null>(null);
  const [headerImagePreview, setHeaderImagePreview] = useState<string>('');
  const [footerImagePreview, setFooterImagePreview] = useState<string>('');


  useEffect(() => {
    fetchTemplates();
    fetchAvailableParameters();
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

  const fetchAvailableParameters = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get('/recipient-lists/parameters');
      setAvailableParameters(response.data.data);
    } catch (error: any) {
      console.error('Error fetching available parameters:', error);
    }
  };

  // File upload functions
  const handleHeaderImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setHeaderImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setHeaderImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFooterImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFooterImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFooterImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeHeaderImage = () => {
    setHeaderImage(null);
    setHeaderImagePreview('');
  };

  const removeFooterImage = () => {
    setFooterImage(null);
    setFooterImagePreview('');
  };

  // Upload image to server
  const uploadImage = async (file: File, type: 'header' | 'footer') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    try {
      const response = await api.post('/templates/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      console.log('Auth token:', token ? 'Present' : 'Missing');
      if (!token) {
        alert('Please log in to create templates');
        return;
      }

      let imageUrl = formData.imageUrl;
      let footerImageUrl = formData.footerImageUrl;

      // Upload images if they exist
      if (headerImage) {
        console.log('Uploading header image...');
        imageUrl = await uploadImage(headerImage, 'header');
        console.log('Header image uploaded:', imageUrl);
      }
      
      if (footerImage) {
        console.log('Uploading footer image...');
        footerImageUrl = await uploadImage(footerImage, 'footer');
        console.log('Footer image uploaded:', footerImageUrl);
      }

      // Extract parameters from content if not provided
      let extractedParameters = formData.parameters || [];
      if (!formData.parameters && formData.content) {
        const paramMatches = formData.content.match(/#[A-Za-z0-9_]+/g);
        if (paramMatches) {
          extractedParameters = [...new Set(paramMatches.map((param: string) => param.substring(1)))];
        }
      }

      const templateData = {
        name: formData.name,
        content: formData.content,
        type: formData.type,
        imageUrl: imageUrl || '',
        footerImageUrl: footerImageUrl || '',
        parameters: extractedParameters
      };

      console.log('Creating template with data:', templateData);
      console.log('API base URL:', api.defaults.baseURL);
      console.log('Request headers:', api.defaults.headers);

      if (editingTemplate) {
        console.log('Updating template:', editingTemplate.name);
        await api.put(`/templates/${editingTemplate.name}`, templateData);
      } else {
        console.log('Creating new template...');
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
        footerImageUrl: '',
        parameters: []
      });
      
      // Reset file states
      setHeaderImage(null);
      setFooterImage(null);
      setHeaderImagePreview('');
      setFooterImagePreview('');
      
      alert('Template created successfully!');
    } catch (error: any) {
      console.error('Error saving template:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to create template: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      type: template.type,
      imageUrl: template.imageUrl || '',
      footerImageUrl: template.footerImageUrl || '',
      parameters: template.parameters
    });
    // Set preview images for editing
    if (template.imageUrl) {
      setHeaderImagePreview(template.imageUrl);
    }
    if (template.footerImageUrl) {
      setFooterImagePreview(template.footerImageUrl);
    }
    setShowCreateForm(true);
  };

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await api.delete(`/templates/${templateToDelete.name}`);
      await fetchTemplates();
      setShowDeleteDialog(false);
      setTemplateToDelete(null);
    } catch (error: any) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setTemplateToDelete(null);
  };

  const handlePreview = (template: Template) => {
    console.log('Previewing template:', template);
    console.log('Template imageUrl:', template.imageUrl);
    console.log('Template footerImageUrl:', template.footerImageUrl);
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
      footerImageUrl: template.footerImageUrl || '',
      parameters: template.parameters
    });
    setShowCreateForm(true);
  };

  // Export template as PNG
  const exportTemplateAsPNG = async (template: Template) => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      let yPosition = 50;

      // Add template name
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(template.name, canvas.width / 2, yPosition);
      yPosition += 40;

      // Add header image if exists
      if (template.imageUrl) {
        const headerImg = new Image();
        headerImg.crossOrigin = 'anonymous';
        headerImg.onload = () => {
          const imgHeight = 200;
          const imgWidth = Math.min(400, (headerImg.width * imgHeight) / headerImg.height);
          const x = (canvas.width - imgWidth) / 2;
          ctx.drawImage(headerImg, x, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 20;
          
          // Add content
          ctx.fillStyle = '#374151';
          ctx.font = '16px Arial';
          ctx.textAlign = 'left';
          const lines = template.content.split('\n');
          lines.forEach((line, index) => {
            if (yPosition + (index + 1) * 20 < canvas.height - 100) {
              ctx.fillText(line, 50, yPosition + (index + 1) * 20);
            }
          });
          yPosition += lines.length * 20 + 20;

          // Add footer image if exists
          if (template.footerImageUrl) {
            const footerImg = new Image();
            footerImg.crossOrigin = 'anonymous';
            footerImg.onload = () => {
              const footerHeight = 100;
              const footerWidth = Math.min(300, (footerImg.width * footerHeight) / footerImg.height);
              const footerX = (canvas.width - footerWidth) / 2;
              ctx.drawImage(footerImg, footerX, yPosition, footerWidth, footerHeight);
              
              // Download the image
              const link = document.createElement('a');
              link.download = `${template.name.replace(/\s+/g, '_')}.png`;
              link.href = canvas.toDataURL();
              link.click();
            };
            footerImg.src = template.footerImageUrl;
          } else {
            // Download without footer image
            const link = document.createElement('a');
            link.download = `${template.name.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL();
            link.click();
          }
        };
        headerImg.src = template.imageUrl;
      } else {
        // No header image, just add content
        ctx.fillStyle = '#374151';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        const lines = template.content.split('\n');
        lines.forEach((line, index) => {
          if (yPosition + (index + 1) * 20 < canvas.height - 100) {
            ctx.fillText(line, 50, yPosition + (index + 1) * 20);
          }
        });
        yPosition += lines.length * 20 + 20;

        // Add footer image if exists
        if (template.footerImageUrl) {
          const footerImg = new Image();
          footerImg.crossOrigin = 'anonymous';
          footerImg.onload = () => {
            const footerHeight = 100;
            const footerWidth = Math.min(300, (footerImg.width * footerHeight) / footerImg.height);
            const footerX = (canvas.width - footerWidth) / 2;
            ctx.drawImage(footerImg, footerX, yPosition, footerWidth, footerHeight);
            
            // Download the image
            const link = document.createElement('a');
            link.download = `${template.name.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL();
            link.click();
          };
          footerImg.src = template.footerImageUrl;
        } else {
          // Download without footer image
          const link = document.createElement('a');
          link.download = `${template.name.replace(/\s+/g, '_')}.png`;
          link.href = canvas.toDataURL();
          link.click();
        }
      }
    } catch (error) {
      console.error('Error exporting template as PNG:', error);
    }
  };

  const filteredTemplates = templates
    .filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.parameters.some(param => param.toLowerCase().includes(searchTerm.toLowerCase()));
    
      return matchesSearch;
    })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      if (sortField === 'name') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Sorting function
  const handleSort = (field: 'name' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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
        userRole={user?.role || "Super Admin"}
      />

      {/* Main Content */}
      <div className="ml-24 p-8">
        {/* Header */}
        <Header 
          title="D-MAK"
          subtitle="Digital - Marketing, Automate & Konnect"
          onExportCSV={exportTemplatesToCSV}
          onExportPDF={exportTemplatesToPDF}
          showExportButtons={false}
        />

        {/* Separator Line */}
        <div className="border-b-2 border-indigo-500 my-6"></div>

        {/* Template Management Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Template Management</h2>

        {/* Main Content Area */}
        <CommonFeatures
          summaryItems={summaryItems}
          onExportCSV={exportTemplatesToCSV}
          onExportPDF={exportTemplatesToPDF}
        >
          <div className="space-y-8">
          
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
                      footerImageUrl: '',
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
                  <span className="text-sm text-gray-700 font-bold">
                    {filteredTemplates.length} of {templates.length}
                  </span>
              </div>

                {/* Search Control */}
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
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-indigo-50 border-b">
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center justify-center">
                          Template Name
                          {sortField === 'name' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
                          )}
              </div>
                      </th>
                      <th 
                        className="text-center py-3 px-6 text-sm font-medium text-gray-700 cursor-pointer hover:bg-indigo-100"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center justify-center">
                          Date Created
                          {sortField === 'createdAt' && (
                            <span className="ml-1">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
            </div>
                      </th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
              {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((template, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-6 text-sm text-gray-900 text-center font-medium">{template.name}</td>
                          <td className="py-3 px-6 text-sm text-gray-900 text-center">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-6 text-sm text-center">
                            <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handlePreview(template)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                title="Preview Template"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                                onClick={() => exportTemplateAsPNG(template)}
                                className="text-green-600 hover:text-green-800 p-1 rounded"
                                title="Export as PNG"
                              >
                                <Download className="h-4 w-4" />
                        </button>
                              <button
                                onClick={() => handleDeleteClick(template)}
                                className="text-red-600 hover:text-red-800 p-1 rounded"
                                title="Delete Template"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              {user?.role === 'super-admin' && (
                                <>
                        <button
                          onClick={() => handleEdit(template)}
                                    className="text-orange-600 hover:text-orange-800 p-1 rounded"
                                    title="Edit Template"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                                    onClick={() => duplicateTemplate(template)}
                                    className="text-purple-600 hover:text-purple-800 p-1 rounded"
                                    title="Duplicate Template"
                                  >
                                    <Copy className="h-4 w-4" />
                        </button>
                                </>
                      )}
                    </div>
                          </td>
                        </tr>
                ))
              ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-12">
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
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTemplate(null);
                    setHeaderImage(null);
                    setFooterImage(null);
                    setHeaderImagePreview('');
                    setFooterImagePreview('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Template Name */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter template name"
                />
              </div>
              
                {/* Header Image Upload */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Header Image (Optional)
                </label>
                  <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                      onChange={handleHeaderImageUpload}
                      className="hidden"
                      id="header-image-upload"
                    />
                    <label
                      htmlFor="header-image-upload"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors"
                    >
                      <Upload className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Click to upload header image</span>
                    </label>
                    
                    {headerImagePreview && (
                      <div className="relative">
                        <img
                          src={headerImagePreview}
                          alt="Header preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={removeHeaderImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                </div>
              )}
                  </div>
                </div>

                {/* Template Content */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text *
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <textarea
                        required
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter template content with parameters like #FirstName, #LastName, #Month, #Target..."
                      />
                  </div>
                  
                  {/* Live Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Live Preview
                    </label>
                    <div className="bg-gray-100 p-4 rounded-lg h-40 overflow-y-auto">
                        <div className="bg-white rounded-2xl rounded-tl-md shadow-sm max-w-xs mx-auto">
                          {(headerImagePreview || formData.imageUrl) && (
                            <div className="w-full">
                              <img 
                                src={headerImagePreview || formData.imageUrl} 
                                alt="Header"
                                className="w-full h-24 object-cover rounded-t-2xl"
                              />
                            </div>
                          )}
                          <div className="p-3">
                            <div className="text-gray-800 text-xs leading-relaxed whitespace-pre-wrap">
                              {(() => {
                                if (!formData.content) return 'Start typing your template...';
                                
                                let processedContent = formData.content;
                                
                                // Sample parameter values for live preview
                                const sampleParams = {
                                  'FirstName': 'John',
                                  'LastName': 'Doe',
                                  'MRId': 'MR001',
                                  'GroupName': 'North Zone',
                                  'PhoneNumber': '+919876543210',
                                  'Name': 'John Doe',
                                  'Company': 'D-MAK',
                                  'Product': 'New Product',
                                  'Date': new Date().toLocaleDateString(),
                                  'Time': new Date().toLocaleTimeString(),
                                  'Month': new Date().toLocaleDateString('en-US', { month: 'long' }),
                                  'Year': new Date().getFullYear().toString(),
                                  'Target': '100',
                                  'Achievement': '85',
                                  'Location': 'Mumbai',
                                  'City': 'Mumbai',
                                  'State': 'Maharashtra',
                                  'Country': 'India'
                                };
                                
                                // Replace parameters with sample values
                                for (const [param, value] of Object.entries(sampleParams)) {
                                  const regex = new RegExp(`#${param}\\b`, 'g');
                                  processedContent = processedContent.replace(regex, value);
                                }
                                
                                // Replace any remaining parameters with [Sample Value]
                                processedContent = processedContent.replace(/#[A-Za-z0-9_]+/g, '[Sample Value]');
                                
                                return processedContent;
                              })()}
                            </div>
                          </div>
                          {(footerImagePreview || formData.footerImageUrl) && (
                            <div className="px-3 pb-3">
                              <img 
                                src={footerImagePreview || formData.footerImageUrl} 
                                alt="Footer"
                                className="w-full h-16 object-cover rounded-lg"
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
                  
                  {/* Available Parameters */}
                  {availableParameters && availableParameters.parameters.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Available Parameters from Recipient Lists:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableParameters.parameters.map((param, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              const newContent = formData.content + param;
                              setFormData({...formData, content: newContent});
                            }}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 cursor-pointer"
                          >
                            {param}
                          </button>
                        ))}
              </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Click on parameters to add them to your template
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Use #ParameterName for dynamic parameters (e.g., #FN, #LN, #Month, #Target)
                  </p>
                </div>

                {/* Footer Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Footer Image (Optional)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFooterImageUpload}
                      className="hidden"
                      id="footer-image-upload"
                    />
                    <label
                      htmlFor="footer-image-upload"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors"
                    >
                      <Upload className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Click to upload footer image</span>
                    </label>
                    
                    {footerImagePreview && (
                      <div className="relative">
                        <img
                          src={footerImagePreview}
                          alt="Footer preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                <button
                          type="button"
                          onClick={removeFooterImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTemplate(null);
                      setHeaderImage(null);
                      setFooterImage(null);
                      setHeaderImagePreview('');
                      setFooterImagePreview('');
                    }}
                    className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Preview Modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Template Preview
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {previewTemplate.name} • Created {new Date(previewTemplate.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* WhatsApp Message Preview - Main Focus */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <h3 className="text-lg font-semibold text-gray-800">WhatsApp Message Preview</h3>
                </div>
                
                <div className="flex justify-center">
                  <div className="bg-white rounded-3xl rounded-tl-lg shadow-2xl max-w-sm w-full overflow-hidden">
                    {/* Header Image */}
                    {previewTemplate.imageUrl && (
                      <div className="w-full">
                        <img 
                          src={previewTemplate.imageUrl} 
                          alt="Header"
                          className="w-full h-64 object-cover"
                          onError={(e) => {
                            console.error('WhatsApp preview header image failed to load:', previewTemplate.imageUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => console.log('WhatsApp preview header image loaded successfully:', previewTemplate.imageUrl)}
                        />
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div className="p-4">
                      <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {(() => {
                          let processedContent = previewTemplate.content;
                          
                          // Sample parameter values for preview
                          const sampleParams = {
                            'FirstName': 'John',
                            'LastName': 'Doe',
                            'MRId': 'MR001',
                            'GroupName': 'North Zone',
                            'PhoneNumber': '+919876543210',
                            'Name': 'John Doe',
                            'Company': 'D-MAK',
                            'Product': 'New Product',
                            'Date': new Date().toLocaleDateString(),
                            'Time': new Date().toLocaleTimeString(),
                            'Month': new Date().toLocaleDateString('en-US', { month: 'long' }),
                            'Year': new Date().getFullYear().toString(),
                            'Target': '100',
                            'Achievement': '85',
                            'Location': 'Mumbai',
                            'City': 'Mumbai',
                            'State': 'Maharashtra',
                            'Country': 'India'
                          };
                          
                          // Replace parameters with sample values
                          for (const [param, value] of Object.entries(sampleParams)) {
                            const regex = new RegExp(`#${param}\\b`, 'g');
                            processedContent = processedContent.replace(regex, value);
                          }
                          
                          // Replace any remaining parameters with [Sample Value]
                          processedContent = processedContent.replace(/#[A-Za-z0-9_]+/g, '[Sample Value]');
                          
                          return processedContent;
                        })()}
                      </div>
                    </div>
                    
                    {/* Footer Image */}
                    {previewTemplate.footerImageUrl && (
                      <div className="px-4 pb-4">
                        <img 
                          src={previewTemplate.footerImageUrl} 
                          alt="Footer"
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            console.error('Footer image failed to load:', previewTemplate.footerImageUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => console.log('Footer image loaded successfully:', previewTemplate.footerImageUrl)}
                        />
                      </div>
                    )}
                    
                    {/* WhatsApp message time and status */}
                    <div className="px-4 pb-3">
                      <div className="flex justify-end items-center">
                        <span className="text-xs text-gray-500 mr-1">
                          {new Date().toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                        <span className="text-xs text-gray-500">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 mt-3 text-center">
                  * This shows how the message will appear in WhatsApp with sample parameter values
                </p>
              </div>

              {/* Template Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Template Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Template Name</label>
                      <p className="text-gray-900">{previewTemplate.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <p className="text-gray-900 capitalize">{previewTemplate.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created</label>
                      <p className="text-gray-900">{new Date(previewTemplate.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Content Length</label>
                      <p className="text-gray-900">{previewTemplate.content.length} characters</p>
                    </div>
                  </div>
                </div>

                {/* Parameters */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Parameters</h4>
                  {previewTemplate.parameters.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {previewTemplate.parameters.map((param, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                        >
                          #{param}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No parameters found in this template</p>
                  )}
                </div>
              </div>

              {/* Raw Content Preview */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Raw Content</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {previewTemplate.content}
                  </pre>
                </div>
              </div>

              {/* Images Preview */}
              {(previewTemplate.imageUrl || previewTemplate.footerImageUrl) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Images</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {previewTemplate.imageUrl && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">Header Image</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <img 
                            src={previewTemplate.imageUrl} 
                            alt="Header"
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              console.error('Header image failed to load:', previewTemplate.imageUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => console.log('Header image loaded successfully:', previewTemplate.imageUrl)}
                          />
                        </div>
                      </div>
                    )}
                    
                    {previewTemplate.footerImageUrl && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-2 block">Footer Image</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <img 
                            src={previewTemplate.footerImageUrl} 
                            alt="Footer"
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              console.error('Footer image failed to load:', previewTemplate.footerImageUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => console.log('Footer image loaded successfully:', previewTemplate.footerImageUrl)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && templateToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Template
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete the template "{templateToDelete.name}"? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
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

export default Templates;
