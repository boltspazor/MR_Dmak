import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UploadProgressDialog from '../components/ui/UploadProgressDialog';
import AddMRDialog from '../components/AddMRDialog';
import EditMRDialog from '../components/EditMRDialog';
import MRActionButtons from '../components/mr/MRActionButtons';
import MRList from '../components/mr/MRList';
import MRManagementHeader from '../components/mr/MRManagementHeader';
import MRDeleteDialog from '../components/mr/MRDeleteDialog';
import { Contact, Group } from '../types/mr.types';
import { useMRData } from '../hooks/useMRData';
import { useCSVImport } from '../hooks/useCSVImport';
import { useMRManagement } from '../hooks/useMRManagement';
import { useMRExport } from '../hooks/useMRExport';
import { useMRStats } from '../hooks/useMRStats';
import { useMRSorting } from '../hooks/useMRSorting';


// Real API calls using the configured API instance

const SimpleMRTool: React.FC = () => {

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

  // Export functionality
  const { exportContactsToCSV, exportContactsToPDF, downloadCSVTemplate } = useMRExport({ contacts });

  // Statistics
  const { summaryItems } = useMRStats({ contacts, groups });

  // Sorting
  const { sortField, sortDirection, handleSort } = useMRSorting();

  // Management operations
  const {
    editingContact,
    isEditDialogOpen,
    showDeleteDialog,
    contactToDelete,
    handleEditContact,
    handleUpdateContact,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    closeEditDialog
  } = useMRManagement({
    contacts,
    onUpdateContact: updateContact,
    onDeleteContact: deleteContact
  });

  // UI state
  const [isAddMRDialogOpen, setIsAddMRDialogOpen] = useState(false);



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

  const handleTemplateDownload = () => {
    downloadCSVTemplate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Main Content */}
      <div className="p-8">
        {/* Header and Stats */}
        <MRManagementHeader
          summaryItems={summaryItems}
          onExportCSV={exportContactsToCSV}
          onExportPDF={exportContactsToPDF}
          loading={loading}
        />

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
            loading={loading}
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
          onClose={closeEditDialog}
          onUpdate={handleUpdateContact}
          contact={editingContact}
          groups={groups}
        />

        {/* Delete Confirmation Dialog */}
        <MRDeleteDialog
          isOpen={showDeleteDialog}
          contactToDelete={contactToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
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

export default SimpleMRTool;