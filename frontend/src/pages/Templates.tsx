import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { api } from '../lib/api';
import { templateApi } from '../api/templates';
import toast from 'react-hot-toast';
import { Template, AvailableParameters } from '../types';
import Header from '../components/Header';
import CommonFeatures from '../components/CommonFeatures';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import TemplatePreviewDialog from '../components/ui/TemplatePreviewDialog';
import TemplateRecipientUploadV2 from '../components/ui/TemplateRecipientUploadV2';
import { useTemplateRecipients } from '../hooks/useTemplateRecipients';
import { extractTemplateParameters, escapeCSV } from '../utils/csvValidation';

// Import new components
import TemplateFilters from '../components/templates/TemplateFilters';
import MetaIntegration from '../components/templates/MetaIntegration';
import TemplateTable from '../components/templates/TemplateTable';
import DeleteConfirmationDialog from '../components/templates/DeleteConfirmationDialog';

// Import custom hooks
import { useTemplates } from '../hooks/useTemplates';
import { useMetaTemplates } from '../hooks/useMetaTemplates';

const Templates: React.FC = () => {
  const { alert } = useConfirm();

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

  const {
    metaTemplateStats,
    syncingTemplates,
    loadMetaTemplateStats,
    syncTemplatesWithMeta,
    getMetaTemplateCreationUrl
  } = useMetaTemplates();

  // Local state
  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const [contentSearchTerm, setContentSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'createdAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [availableParameters, setAvailableParameters] = useState<AvailableParameters | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);
  const [showRecipientUpload, setShowRecipientUpload] = useState(false);
  const [uploadTemplate, setUploadTemplate] = useState<Template | null>(null);
  const [templateFilter, setTemplateFilter] = useState<'all' | 'custom' | 'meta'>('all');
  const [metaStatusFilter, setMetaStatusFilter] = useState<'all' | 'APPROVED' | 'PENDING' | 'REJECTED'>('all');

  // Load data on mount
  useEffect(() => {
    loadTemplates();
    loadMetaTemplateStats();
    fetchAvailableParameters();
  }, [loadTemplates, loadMetaTemplateStats]);

  const fetchAvailableParameters = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get('/recipient-lists/parameters');
      setAvailableParameters(response.data.data);
    } catch (error: unknown) {
      console.error('Error fetching available parameters:', error);
    }
  };

  // Memoize filtered and sorted templates
  const filteredTemplates = useMemo(() => {
    return templates
      .filter(template => {
        const matchesNameSearch = !nameSearchTerm ||
          template.name.toLowerCase().includes(nameSearchTerm.toLowerCase());

        const matchesContentSearch = !contentSearchTerm ||
          template.content.toLowerCase().includes(contentSearchTerm.toLowerCase()) ||
          template.parameters.some(param => param.toLowerCase().includes(contentSearchTerm.toLowerCase()));

        // Meta template filtering
        const matchesTemplateType = templateFilter === 'all' ||
          (templateFilter === 'custom' && !template.isMetaTemplate) ||
          (templateFilter === 'meta' && template.isMetaTemplate);

        // Meta status filtering (only applies to Meta templates)
        const matchesMetaStatus = metaStatusFilter === 'all' ||
          !template.isMetaTemplate ||
          template.metaStatus === metaStatusFilter;

        return matchesNameSearch && matchesContentSearch && matchesTemplateType && matchesMetaStatus;
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
  }, [templates, nameSearchTerm, contentSearchTerm, sortField, sortDirection, templateFilter, metaStatusFilter]);

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
      
      // Use Meta API deletion for Meta templates
      if (templateToDelete.isMetaTemplate) {
        result = await templateApi.deleteWithMeta(templateToDelete._id);
        
        if (result.metaDeletion.success) {
          console.log('Meta API deletion:', result.metaDeletion.message);
        } else {
          console.warn('Meta API deletion warning:', result.metaDeletion.message);
        }
      } else {
        // Use regular deletion for custom templates
        result = await templateApi.delete(templateToDelete._id);
      }
      
      setShowDeleteDialog(false);
      setTemplateToDelete(null);
      
      // Refresh templates list
      await loadTemplates();
      
      // Show success message with Meta deletion info if applicable
      let successMessage = 'Template deleted successfully!';
      if (templateToDelete.isMetaTemplate && result.metaDeletion) {
        if (result.metaDeletion.message.includes('cannot be deleted from Meta API (not supported)')) {
          successMessage += ` Note: Template removed from local database. Meta API deletion is not supported by WhatsApp Business Platform.`;
        } else if (result.metaDeletion.success) {
          successMessage += ` Meta API: ${result.metaDeletion.message}`;
        } else {
          successMessage += ` Meta API warning: ${result.metaDeletion.message}`;
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

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleBulkUploadRecipients = (template: Template) => {
    setUploadTemplate(template);
    setShowRecipientUpload(true);
  };

  const downloadRecipientListFormat = (template: Template) => {
    const parameters = extractTemplateParameters(template.content);
    const csvRows = [];

    const row1 = [template.name, ...Array(Math.max(parameters.length + 2, 10)).fill('')];
    csvRows.push(row1.map(escapeCSV).join(','));

    const row2 = ['mrId', 'firstName', 'lastName', ...parameters];
    csvRows.push(row2.map(escapeCSV).join(','));

    const sampleData = {
      'MR id': 'MR001',
      'First Name': 'John',
      'Last Name': 'Doe',
      'FN': 'John',
      'LN': 'Doe',
      'Month': 'September',
      'week': 'Week 2',
      'Target': '1 crore',
      'lastmonth': '50 lakhs',
      'doctor': '30',
      'Name': 'John Doe',
      'Company': 'D-MAK',
      'Product': 'New Product',
      'Product Name': 'New Product',
      'Date': new Date().toLocaleDateString(),
      'Time': new Date().toLocaleTimeString(),
      'Year': new Date().getFullYear().toString(),
      'Achievement': '85',
      'Location': 'Mumbai',
      'City': 'Mumbai',
      'State': 'Maharashtra',
      'Country': 'India',
      'Phone Number': '+919876543210',
      'Group Name': 'North Zone',
      'Target Amount': '100000',
      'Sales Amount': '85000'
    };

    const row3 = ['MR001', 'John', 'Doe', ...parameters.map(param => (sampleData as Record<string, string>)[param] || `Sample ${param}`)];
    csvRows.push(row3.map(escapeCSV).join(','));

    const csvContent = csvRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '_')}_recipient_list_format.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get recipients for the preview template
  const { recipients: previewRecipients, fetchRecipients: fetchPreviewRecipients } = useTemplateRecipients(previewTemplate?._id);

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
          <Header
            title="D-MAK"
            subtitle="Digital - Marketing, Automate & Konnect"
            onExportCSV={exportTemplatesToCSV}
            onExportPDF={exportTemplatesToPDF}
            showExportButtons={false}
          />
          <div className="border-b-2 border-indigo-500 my-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Templates Management</h2>

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
      {/* Main Content */}
      <div className="p-8">
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

        {/* Templates Management Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Templates Management</h2>

        {/* Main Content Area */}
        <CommonFeatures
          summaryItems={summaryItems}
          onExportCSV={exportTemplatesToCSV}
          onExportPDF={exportTemplatesToPDF}
        >
          <div className="space-y-6">
            {/* Meta Template Integration */}
            <MetaIntegration
              metaTemplateStats={metaTemplateStats}
              syncingTemplates={syncingTemplates}
              onGetMetaTemplateCreationUrl={getMetaTemplateCreationUrl}
              onSyncTemplatesWithMeta={syncTemplatesWithMeta}
              onRefreshTemplates={loadTemplates}
            />

            {/* Filters and Search */}
            <TemplateFilters
              nameSearchTerm={nameSearchTerm}
              setNameSearchTerm={setNameSearchTerm}
              contentSearchTerm={contentSearchTerm}
              setContentSearchTerm={setContentSearchTerm}
              templateFilter={templateFilter}
              setTemplateFilter={setTemplateFilter}
              metaStatusFilter={metaStatusFilter}
              setMetaStatusFilter={setMetaStatusFilter}
              filteredCount={filteredTemplates.length}
              totalCount={templates.length}
            />

            {/* Templates Table */}
            <TemplateTable
              templates={filteredTemplates}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onPreview={handlePreview}
              onExportPNG={exportTemplateAsPNG}
              onDelete={handleDeleteClick}
            />
          </div>
        </CommonFeatures>

        {/* Template Preview Modal */}
        <TemplatePreviewDialog
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          template={{
            ...previewTemplate,
            recipientLists: previewRecipients
          } as Template}
          onDownloadRecipientList={downloadRecipientListFormat}
          onBulkUploadRecipients={handleBulkUploadRecipients}
          showDownloadButton={true}
          showBulkUploadButton={true}
          variant="full"
          onUpdateTemplate={updateTemplate}
        />

        {/* Recipient Upload Modal */}
        {showRecipientUpload && uploadTemplate && (
          <TemplateRecipientUploadV2
            template={uploadTemplate}
            showError={(_title: string, message: string, isError?: boolean) => {
              alert(message, isError ? 'error' : 'info');
            }}
            onUploadSuccess={() => {
              if (previewTemplate?._id === uploadTemplate._id) {
                fetchPreviewRecipients(previewTemplate._id);
              }
            }}
            onClose={() => {
              setShowRecipientUpload(false);
              setUploadTemplate(null);
            }}
          />
        )}

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