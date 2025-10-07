import React, { useState, useEffect } from 'react';
import UploadProgressDialog from '../components/ui/UploadProgressDialog';
import AddMRDialog from '../components/AddMRDialog';
import EditMRDialog from '../components/EditMRDialog';
import MRActionButtons from '../components/mr/MRActionButtons';
import MRList from '../components/mr/MRList';
import MRManagementHeader from '../components/mr/MRManagementHeader';
import MRDeleteDialog from '../components/mr/MRDeleteDialog';
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
    fetchContacts,
    fetchGroups,
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
  const { downloadCSVTemplate, exportContactsToCSV, exportFilteredMRsToCSV } = useMRExport({ contacts });

  // Statistics
  const { originalSummaryItems, consentSummaryItems, loading: statsLoading } = useMRStats({ contacts, groups });

  // Sorting
  const { sortField, sortDirection, handleSort } = useMRSorting();

  // Management operations
  const {
    editingContact,
    isEditDialogOpen,
    showDeleteDialog,
    contactToDelete,
    isDeleting,
    handleEditContact,
    handleUpdateContact,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    closeEditDialog
  } = useMRManagement({
    contacts,
    onUpdateContact: updateContact,
    onDeleteContact: deleteContact,
    onDeleteSuccess: () => setRefreshTrigger(prev => prev + 1) // Trigger refresh in MRList
  });

  // UI state
  const [isAddMRDialogOpen, setIsAddMRDialogOpen] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);



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
  }, []); 

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
          totalCount={contacts.length}
          filteredCount={contacts.length}
          searchTerm=""
          setSearchTerm={() => {}}
          onAddMR={() => setIsAddMRDialogOpen(true)}
          originalSummaryItems={originalSummaryItems}
          consentSummaryItems={consentSummaryItems}
          loading={loading || statsLoading}
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
            groups={groups}
            onEdit={handleEditContact}
            onDelete={handleDeleteClick}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            onDownloadCSV={exportContactsToCSV}
            onFilteredExport={exportFilteredMRsToCSV}
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
            refreshTrigger={refreshTrigger}
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
          isDeleting={isDeleting}
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