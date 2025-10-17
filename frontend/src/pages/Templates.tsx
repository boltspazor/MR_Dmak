import React, { useState, useEffect, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { templateApi } from '../api/templates';
import toast from 'react-hot-toast';
import { Template } from '../types';
import StandardHeader from '../components/StandardHeader';
import CommonFeatures from '../components/CommonFeatures';
import TemplateFilters from '../components/templates/TemplateFilters';
import TemplateTable from '../components/templates/TemplateTable';
import DeleteConfirmationDialog from '../components/templates/DeleteConfirmationDialog';
import TemplatePreviewManager, { useTemplatePreview } from '../components/templates/TemplatePreviewManager';
import { useTemplates } from '../hooks/useTemplates';

const Templates: React.FC = () => {
  // Custom hooks
  const {
    templates,
    loading,
    loadTemplates,
    updateTemplate,
    exportTemplateAsPNG,
    exportTemplatesToCSV,
    exportTemplatesToPDF
  } = useTemplates();

  // Template preview hook
  const {
    showPreview,
    previewTemplate,
    showRecipientUpload,
    uploadTemplate,
    previewRecipients,
    openPreview,
    closePreview,
    openRecipientUpload,
    closeRecipientUpload,
    downloadRecipientListFormat,
    refreshRecipients,
  } = useTemplatePreview();

  // Local state
  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const [contentSearchTerm, setContentSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'createdAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'utility' | 'marketing'>('all');

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  // Helper functions to categorize templates
  const isUtilityTemplate = (template: Template): boolean => {
    if (template.isMetaTemplate === true) {
      return template.metaCategory === 'UTILITY' || template.metaCategory === 'AUTHENTICATION';
    }
    return true;
  };

  const isMarketingTemplate = (template: Template): boolean => {
    if (template.isMetaTemplate === true) {
      return template.metaCategory === 'MARKETING';
    }
    return false;
  };

  // Load data on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Memoize filtered and sorted templates
  const filteredTemplates = useMemo(() => {
    return templates
      .filter(template => {
        const matchesNameSearch = !nameSearchTerm ||
          template.name.toLowerCase().includes(nameSearchTerm.toLowerCase());

        const matchesContentSearch = !contentSearchTerm ||
          template.content.toLowerCase().includes(contentSearchTerm.toLowerCase()) ||
          template.parameters.some(param => {
            if (typeof param === 'string') {
              return param.toLowerCase().includes(contentSearchTerm.toLowerCase());
            } else {
              return param.name.toLowerCase().includes(contentSearchTerm.toLowerCase());
            }
          });

        const isUtility = isUtilityTemplate(template);
        const isMarketing = isMarketingTemplate(template);

        const finalIsUtility = template.isMetaTemplate === true
          ? (template.metaCategory === 'UTILITY' || template.metaCategory === 'AUTHENTICATION')
          : isUtility || (!isUtility && !isMarketing);
        const finalIsMarketing = template.isMetaTemplate === true
          ? template.metaCategory === 'MARKETING'
          : isMarketing;

        const matchesTemplateType = templateFilter === 'all' ||
          (templateFilter === 'utility' && finalIsUtility) ||
          (templateFilter === 'marketing' && finalIsMarketing);

        return matchesNameSearch && matchesContentSearch && matchesTemplateType;
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
  }, [templates, nameSearchTerm, contentSearchTerm, sortField, sortDirection, templateFilter]);

  // Event handlers
  const handleSort = (field: 'name' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    setIsDeletingTemplate(true);

    try {
      let result;

      if (templateToDelete.isMetaTemplate) {
        result = await templateApi.deleteWithMeta(templateToDelete._id);

        if (result.metaDeletion.success) {
          console.log('Meta API deletion:', result.metaDeletion.message);
        } else {
          console.warn('Meta API deletion warning:', result.metaDeletion.message);
        }
      } else {
        result = await templateApi.delete(templateToDelete._id);
      }

      setShowDeleteDialog(false);
      setTemplateToDelete(null);

      await loadTemplates();

      let successMessage = 'Template deleted successfully!';
      const resultWithMeta = result as any;
      if (templateToDelete.isMetaTemplate && resultWithMeta.metaDeletion) {
        if (resultWithMeta.metaDeletion.message?.includes('cannot be deleted from Meta API (not supported)')) {
          successMessage += ` Note: Template removed from local database. Meta API deletion is not supported by WhatsApp Business Platform.`;
        } else if (resultWithMeta.metaDeletion.success) {
          successMessage += ` Meta API: ${resultWithMeta.metaDeletion.message}`;
        } else {
          successMessage += ` Meta API warning: ${resultWithMeta.metaDeletion.message}`;
        }
      }

      toast.success(successMessage, { duration: 5000 });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete template';
      toast.error(`Error: ${errorMessage}`, { duration: 5000 });
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  const handleSyncMetaTemplates = async () => {
    try {
      toast.loading('Syncing Meta templates...', { id: 'sync-toast' });

      const result = await templateApi.syncMetaTemplates();

      if (result.success) {
        await loadTemplates();

        toast.success(result.message || 'Meta templates synced successfully!', {
          id: 'sync-toast',
          duration: 3000
        });
      } else {
        toast.error(result.error || 'Failed to sync Meta templates', {
          id: 'sync-toast',
          duration: 5000
        });
      }
    } catch (error: any) {
      console.error('Error syncing Meta templates:', error);
      toast.error(error.response?.data?.error || 'Failed to sync Meta templates', {
        id: 'sync-toast',
        duration: 5000
      });
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
        <div className="p-8">
          <StandardHeader pageTitle="Templates" />

          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg h-32 border border-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <StandardHeader pageTitle="Templates" />

        <CommonFeatures
          summaryItems={summaryItems}
          onExportCSV={exportTemplatesToCSV}
          onExportPDF={exportTemplatesToPDF}
        >
          <div className="space-y-6">
            <TemplateFilters
              nameSearchTerm={nameSearchTerm}
              setNameSearchTerm={setNameSearchTerm}
              contentSearchTerm={contentSearchTerm}
              setContentSearchTerm={setContentSearchTerm}
              templateFilter={templateFilter}
              setTemplateFilter={setTemplateFilter}
              filteredCount={filteredTemplates.length}
              totalCount={templates.length}
            />

            <TemplateTable
              templates={filteredTemplates}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onPreview={openPreview}
              onExportPNG={exportTemplateAsPNG}
              onDelete={handleDeleteClick}
              onSync={handleSyncMetaTemplates}
            />
          </div>
        </CommonFeatures>

        {/* Template Preview Manager - handles all preview logic */}
        <TemplatePreviewManager
          isOpen={showPreview}
          template={previewTemplate}
          onClose={closePreview}
          variant="full"
          showDownloadButton={true}
          showBulkUploadButton={true}
          onUpdateTemplate={updateTemplate}
          onUploadSuccess={() => loadTemplates()}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          template={templateToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteDialog(false);
            setTemplateToDelete(null);
          }}
          isDeleting={isDeletingTemplate}
        />
      </div>
    </div>
  );
};

export default Templates;
