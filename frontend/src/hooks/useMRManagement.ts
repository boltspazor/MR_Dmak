import { useState, useCallback } from 'react';
import { Contact } from '../types/mr.types';
import { useConfirm } from '../contexts/ConfirmContext';

interface UseMRManagementProps {
  contacts: Contact[];
  onUpdateContact: (id: string, contactData: Omit<Contact, 'id'>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
  onDeleteSuccess?: () => void; // Add callback for successful deletion
}

export const useMRManagement = ({ 
  contacts, 
  onUpdateContact, 
  onDeleteContact,
  onDeleteSuccess
}: UseMRManagementProps) => {
  const { alert } = useConfirm();
  
  // Dialog states
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Contact management functions
  const handleEditContact = useCallback((contact: Contact) => {
    setEditingContact(contact);
    setIsEditDialogOpen(true);
  }, []);

  const handleUpdateContact = useCallback(async (updatedContact: Omit<Contact, 'id'>) => {
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

      await onUpdateContact(editingContact.id, updatedContact);

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
  }, [editingContact, contacts, onUpdateContact, alert]);

  const handleDeleteClick = useCallback((contact: Contact) => {
    setContactToDelete(contact);
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!contactToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      
      await onDeleteContact(contactToDelete.id);
      
      // Close dialog and clear state after successful deletion
      setShowDeleteDialog(false);
      setContactToDelete(null);
      
      // Call success callback if provided
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
      
      await alert('MR deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      await alert('Failed to delete MR', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [contactToDelete, isDeleting, onDeleteContact, onDeleteSuccess, alert]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteDialog(false);
    setContactToDelete(null);
  }, []);

  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setEditingContact(null);
  }, []);

  return {
    // Dialog states
    editingContact,
    isEditDialogOpen,
    showDeleteDialog,
    contactToDelete,
    isDeleting,
    
    // Actions
    handleEditContact,
    handleUpdateContact,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    closeEditDialog
  };
};
