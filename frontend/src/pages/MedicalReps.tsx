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
import { useConfirm } from '../contexts/ConfirmContext';
import TemplateNameDialog from '../components/ui/TemplateNameDialog';
import UploadProgressDialog from '../components/ui/UploadProgressDialog';

const MedicalReps: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm, alert } = useConfirm();
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
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'csv'>('excel');
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    currentBatch: 0,
    totalBatches: 0
  });
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'completed' | 'error'>('uploading');
  const [uploadMessage, setUploadMessage] = useState('');

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
      let errorMessage = error.response?.data?.error || error.message || 'Failed to create MR. Please try again.';
      
      // Clean up error messages to replace technical details with app name
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
      let errorMessage = error.response?.data?.error || error.message || 'Failed to update MR. Please try again.';
      
      // Clean up error messages to replace technical details with app name
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
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this MR?',
      type: 'warning',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await api.delete(`/mrs/${id}`);
      await fetchMRs();
    } catch (error: any) {
      console.error('Error deleting MR:', error);
    }
  };

  const downloadTemplate = async (format: 'excel' | 'csv', templateName: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const endpoint = format === 'excel' ? '/mrs/template' : '/mrs/template/csv';
      const response = await api.get(`${endpoint}?templateName=${encodeURIComponent(templateName)}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `${templateName.replace(/[^a-zA-Z0-9]/g, '_')}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading template:', error);
      await alert('Failed to download template', 'error');
    }
  };

  const handleTemplateDownload = (format: 'excel' | 'csv') => {
    setSelectedFormat(format);
    setShowTemplateDialog(true);
  };

  const handleTemplateConfirm = async (templateName: string) => {
    setShowTemplateDialog(false);
    await downloadTemplate(selectedFormat, templateName);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim()); // Remove empty lines
      
      // Skip header row
      const dataRows = lines.slice(1);
      
      if (dataRows.length === 0) {
        await alert('No data rows found in the uploaded file', 'error');
        event.target.value = '';
        return;
      }

      // Initialize progress tracking
      const totalRows = dataRows.length;
      const batchSize = 10; // Process 10 records at a time
      const totalBatches = Math.ceil(totalRows / batchSize);
      
      setUploadProgress({
        total: totalRows,
        processed: 0,
        successful: 0,
        failed: 0,
        currentBatch: 0,
        totalBatches: totalBatches
      });
      
      setUploadStatus('uploading');
      setUploadMessage(`Starting upload of ${totalRows} MRs in ${totalBatches} batches...`);
      setShowUploadProgress(true);
      setShowUploadForm(false); // Close the upload form modal

      let totalSuccessful = 0;
      let totalFailed = 0;
      const allErrors: string[] = [];

      // Process data in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, totalRows);
        const batch = dataRows.slice(startIndex, endIndex);
        
        setUploadProgress(prev => ({
          ...prev,
          currentBatch: batchIndex + 1
        }));
        
        setUploadMessage(`Processing batch ${batchIndex + 1} of ${totalBatches} (${batch.length} records)...`);

        // Process each record in the current batch
        for (let rowIndex = 0; rowIndex < batch.length; rowIndex++) {
          const actualRowIndex = startIndex + rowIndex + 2; // +2 because we skipped header and 0-indexed
          const line = batch[rowIndex].trim();
          
          if (!line) {
            allErrors.push(`❌ Row ${actualRowIndex}: Empty row found`);
            totalFailed++;
            continue;
          }
          
          const values = line.split(',');
          
          // Validate required columns
          if (values.length < 5) {
            allErrors.push(`❌ Row ${actualRowIndex}: Missing required columns (expected 5+ columns, found ${values.length})`);
            totalFailed++;
            continue;
          }

          // Validate MR ID
          if (!values[0] || !values[0].trim()) {
            allErrors.push(`❌ Row ${actualRowIndex}: MR ID is required`);
            totalFailed++;
            continue;
          }

          // Validate names
          if (!values[1] || !values[1].trim()) {
            allErrors.push(`❌ Row ${actualRowIndex}: First Name is required`);
            totalFailed++;
            continue;
          }
          if (!values[2] || !values[2].trim()) {
            allErrors.push(`❌ Row ${actualRowIndex}: Last Name is required`);
            totalFailed++;
            continue;
          }

          // Validate phone number
          if (!values[3] || !values[3].trim()) {
            allErrors.push(`❌ Row ${actualRowIndex}: Phone number is required`);
            totalFailed++;
            continue;
          }
          if (!values[3].startsWith('+91')) {
            allErrors.push(`❌ Row ${actualRowIndex}: Phone number must start with +91 (found: ${values[3]})`);
            totalFailed++;
            continue;
          }
          if (values[3].length !== 13) {
            allErrors.push(`❌ Row ${actualRowIndex}: Phone number must be 13 digits including +91 (found: ${values[3]})`);
            totalFailed++;
            continue;
          }

          // Check for duplicate MR IDs in existing data
          if (mrs.some(mr => mr.mrId === values[0].trim())) {
            allErrors.push(`❌ Row ${actualRowIndex}: MR ID "${values[0]}" already exists in system`);
            totalFailed++;
            continue;
          }

          // If all validations pass, create MR via API
          try {
            // Find the group ID by name, if group is provided
            let groupId = '';
            if (values[4] && values[4].trim() !== '') {
              const selectedGroup = groups.find(g => g.groupName === values[4].trim());
              if (selectedGroup) {
                groupId = selectedGroup.id;
              }
            }

            await api.post('/mrs', {
              mrId: values[0].trim(),
              firstName: values[1].trim(),
              lastName: values[2].trim(),
              phone: values[3].trim(),
              email: values[5] ? values[5].trim() : '',
              groupId: groupId,
              comments: values[6] ? values[6].trim() : ''
            });
            
            totalSuccessful++;
          } catch (apiError: any) {
            allErrors.push(`❌ Row ${actualRowIndex}: Failed to create MR "${values[0]}": ${apiError.message || 'Unknown error'}`);
            totalFailed++;
          }

          // Update progress after each record
          setUploadProgress(prev => ({
            ...prev,
            processed: prev.processed + 1,
            successful: totalSuccessful,
            failed: totalFailed
          }));
        }

        // Auto-refresh data after each batch of 10 uploads
        if (totalSuccessful > 0 && (batchIndex + 1) % 1 === 0) {
          setUploadMessage(`Refreshing data after batch ${batchIndex + 1}...`);
          await fetchMRs();
        }
      }

      // Final refresh
      if (totalSuccessful > 0) {
        setUploadMessage('Final data refresh...');
        await fetchMRs();
      }

      // Update final status
      setUploadProgress(prev => ({
        ...prev,
        processed: totalRows,
        successful: totalSuccessful,
        failed: totalFailed
      }));

      if (allErrors.length > 0) {
        setUploadStatus('error');
        setUploadMessage(`Upload completed with ${allErrors.length} errors. ${totalSuccessful} MRs were successfully created.`);
      } else if (totalSuccessful === 0) {
        setUploadStatus('error');
        setUploadMessage('No MRs were successfully created. Please check your file format.');
      } else {
        setUploadStatus('completed');
        setUploadMessage(`Successfully uploaded ${totalSuccessful} MRs!`);
      }

      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      setUploadMessage('Failed to upload file: ' + (error.message || 'Unknown error'));
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
                    onClick={() => handleTemplateDownload('excel')}
                    className="px-4 py-2 rounded-lg text-gray-700 text-sm font-semibold border border-gray-300"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel Template
                  </button>
                  <button
                    onClick={() => handleTemplateDownload('csv')}
                    className="px-4 py-2 rounded-lg text-gray-700 text-sm font-semibold border border-gray-300"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Upload an Excel file (.xlsx, .xls) or CSV file. Make sure to follow the template format.
                </p>
                
                {/* File Upload Input */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>

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

        {/* Template Name Dialog */}
        <TemplateNameDialog
          isOpen={showTemplateDialog}
          onClose={() => setShowTemplateDialog(false)}
          onConfirm={handleTemplateConfirm}
          title={`Download ${selectedFormat.toUpperCase()} Template`}
          message={`Please enter a name for your ${selectedFormat.toUpperCase()} template:`}
        />

        {/* Upload Progress Dialog */}
        <UploadProgressDialog
          isOpen={showUploadProgress}
          onClose={() => setShowUploadProgress(false)}
          progress={uploadProgress}
          status={uploadStatus}
          message={uploadMessage}
        />
      </div>
    </div>
  );
};

export default MedicalReps;