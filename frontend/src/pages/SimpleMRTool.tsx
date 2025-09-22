import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import UploadProgressDialog from '../components/ui/UploadProgressDialog';
import {
  Users,
  Trash2,
  FileText,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import AddMRDialog from '../components/AddMRDialog';
import EditMRDialog from '../components/EditMRDialog';
import MRActionButtons from '../components/mr/MRActionButtons';
import MRList from '../components/mr/MRList';
import { Contact, Group } from '../types/mr.types';
import { useMRData } from '../hooks/useMRData';
import { useCSVImport } from '../hooks/useCSVImport';


// Real API calls using the configured API instance

const SimpleMRTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm, alert } = useConfirm();

  // Data management
  const {
    contacts,
    groups,
    loading,
    error,
    fetchContacts,
    fetchGroups,
    addContact,
    updateContact,
    deleteContact
  } = useMRData();

  // CSV import functionality
  const {
    showUploadProgress,
    setShowUploadProgress,
    uploadProgress,
    uploadStatus,
    uploadMessage,
    handleCSVImport
  } = useCSVImport({
    contacts,
    groups,
    onSuccess: fetchContacts
  });

  // UI state
  const [isAddMRDialogOpen, setIsAddMRDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [sortField, setSortField] = useState<keyof Contact>('mrId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');



  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchContacts();
        await fetchGroups();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []); // Remove fetchContacts and fetchGroups from dependencies

  // Contact management functions
  const handleAddMRSuccess = async () => {
    await fetchContacts();
  };

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;

    try {
      await deleteContact(contactToDelete.id);
      setShowDeleteDialog(false);
      setContactToDelete(null);
      await alert('MR deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      await alert('Failed to delete MR', 'error');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setContactToDelete(null);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditDialogOpen(true);
  };

  const handleUpdateContact = async (updatedContact: Omit<Contact, 'id'>) => {
    if (!editingContact) return;

    try {
      // Validate phone number
      if (!updatedContact.phone.startsWith('+91')) {
        throw new Error('Phone number must start with +91');
      }

      // Check for unique MR ID (excluding current contact)
      if (contacts.some(contact => contact.mrId === updatedContact.mrId && contact.id !== editingContact.id)) {
        throw new Error('MR ID already exists. Please use a unique MR ID.');
      }

      await updateContact(editingContact.id, updatedContact);

      setEditingContact(null);
      setIsEditDialogOpen(false);
      await alert('MR updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating contact:', error);
      let errorMessage = error.message || 'Failed to update MR';

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

      // Re-throw the error with cleaned message so EditMRDialog can catch it
      throw new Error(errorMessage);
    }
  };

  const handleSort = (field: keyof Contact) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };


  // CSV import/export functions
  const exportContactsToCSV = () => {
    const csvContent = [
      'MR ID,First Name,Last Name,Phone,Group,Comments',
      ...contacts.map(contact =>
        `${contact.mrId},${contact.firstName},${contact.lastName},${contact.phone},${contact.group},${contact.comments || ''}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mr_contacts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportContactsToPDF = () => {
    // Simple PDF generation using browser's print functionality
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableContent = `
        <html>
          <head>
            <title>MR Contacts Report</title>
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
            <h1>MR Contacts Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Showing ${contacts.length} MRs</p>
            <table>
              <thead>
                <tr>
                  <th>MR ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Group</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                ${contacts.map(contact => `
                  <tr>
                    <td>${contact.mrId}</td>
                    <td>${contact.firstName} ${contact.lastName}</td>
                    <td>${contact.phone}</td>
                    <td>${contact.group}</td>
                    <td>${contact.comments || '-'}</td>
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

  const downloadCSVTemplate = () => {
    // Create simple template without naming
    const templateData = [
      ['mrId', 'firstName', 'lastName', 'phone', 'Group', 'Comments'],
      ['MR001', 'John', 'Doe', '+919876543210', 'Group A', 'Sample comment'],
      ['MR002', 'Jane', 'Smith', '+919876543211', 'Group B', '']
    ];

    const csvContent = templateData.map(row =>
      row.map(cell => {
        // Escape commas and quotes in CSV
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mr_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleTemplateDownload = () => {
    downloadCSVTemplate();
  };

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
      title: 'Total MR',
      value: contacts.length,
      icon: <Users className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-100'
    },
    {
      title: 'Total Groups',
      value: groups.length,
      icon: <FileText className="h-6 w-6 text-green-600" />,
      color: 'bg-green-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
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
        <div className="mb-8">
          <Header
            title="D-MAK"
            subtitle="Digital - Marketing, Automate & Konnect"
            onExportCSV={exportContactsToCSV}
            onExportPDF={exportContactsToPDF}
            showExportButtons={false}
          />
        </div>

        {/* MR Management Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">MR Management</h2>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total MRs</p>
                  <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Groups</p>
                  <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active MRs</p>
                  <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-8">
          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <MRActionButtons
              onAddIndividual={() => setIsAddMRDialogOpen(true)}
              onCSVImport={handleCSVImport}
              onDownloadTemplate={handleTemplateDownload}
            />
          </div>

          {/* MR List with Advanced Search and Pagination */}
          <MRList
            contacts={contacts}
            groups={groups}
            onEdit={handleEditContact}
            onDelete={handleDeleteClick}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
          />
        </div>



        {/* Add MR Dialog */}
        <AddMRDialog
          isOpen={isAddMRDialogOpen}
          onClose={() => setIsAddMRDialogOpen(false)}
          onSuccess={handleAddMRSuccess}
        />

        {/* Edit MR Dialog */}
        <EditMRDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingContact(null);
          }}
          onUpdate={handleUpdateContact}
          contact={editingContact}
          groups={groups}
        />

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && contactToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-200">
            <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-200 transform transition-all duration-200">
              <div className="flex items-center justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Delete MR
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Are you sure you want to delete MR <span className="font-semibold text-gray-900">{contactToDelete.mrId}</span> ({contactToDelete.firstName} {contactToDelete.lastName})? 
                  <br />
                  <span className="text-red-600 font-medium">This action cannot be undone.</span>
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={handleDeleteCancel}
                    className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    Delete
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}


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

export default SimpleMRTool;