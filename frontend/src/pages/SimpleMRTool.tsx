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
    uploadErrors,
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
  const [showErrorAlert, setShowErrorAlert] = useState(false);



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

  // Show error alert when there are upload errors
  useEffect(() => {
    if (uploadErrors && uploadErrors.length > 0 && uploadStatus === 'error') {
      setShowErrorAlert(true);
    }
  }, [uploadErrors, uploadStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Error Alert */}
      {showErrorAlert && uploadErrors && uploadErrors.length > 0 && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800">Bulk Import Failed</h3>
                <p className="text-sm text-red-700 mt-1">
                  {uploadErrors.length} error{uploadErrors.length > 1 ? 's' : ''} occurred during import. 
                  Check the upload dialog for details.
                </p>
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => setShowErrorAlert(false)}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => {
                      setShowErrorAlert(false);
                      setShowUploadProgress(true);
                    }}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            onDownloadCSV={exportContactsToCSV}
          />
        </div>



        {/* Add MR Dialog */}
        <AddMRDialog
          isOpen={isAddMRDialogOpen}
          onClose={() => setIsAddMRDialogOpen(false)}
          onSuccess={handleAddMRSuccess}
          contacts={contacts}
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
          errors={uploadErrors}
        />

      </div>
    </div>
  );
};

export default SimpleMRTool;