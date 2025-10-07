import React, { useState, useEffect } from 'react';
import { Contact, Group } from '../../types/mr.types';
import AdvancedSearch from './AdvancedSearch';
import MRTable from './MRTable';
import {PaginationControls} from '../PaginationControls';
import { useMRData, MRPaginationParams } from '../../hooks/useMRData';

interface MRListProps {
  // Remove contacts from props since we're fetching them internally
  groups: Group[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onSort: (field: keyof Contact) => void;
  sortField: keyof Contact;
  sortDirection: 'asc' | 'desc';
  loading?: boolean;
  onDownloadCSV?: () => void;
  onFilteredExport?: (
    searchTerm?: string,
    groupFilter?: string,
    consentStatusFilter?: string,
    sortField?: string,
    sortDirection?: 'asc' | 'desc'
  ) => void;
  onRefresh?: () => void; // Add refresh callback
  refreshTrigger?: number; // Add refresh trigger
}

const MRList: React.FC<MRListProps> = ({
  groups,
  onEdit,
  onDelete,
  onSort,
  sortField,
  sortDirection,
  loading = false,
  onDownloadCSV,
  onFilteredExport,
  onRefresh,
  refreshTrigger
}) => {
  // Use contacts from the hook instead of props
  const { contacts, fetchContacts, fetchAllContacts, pagination, total, loading: dataLoading } = useMRData();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState<MRPaginationParams>({});

  // Remove useMRFilters since we're doing server-side filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [consentStatusFilter, setConsentStatusFilter] = useState('');

  // URL parameter management
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get('search') || '';
    const urlGroup = urlParams.get('group') || '';
    const urlConsent = urlParams.get('consent') || '';
    const urlPage = parseInt(urlParams.get('page') || '1');

    setSearchTerm(urlSearch);
    setGroupFilter(urlGroup);
    setConsentStatusFilter(urlConsent);
    setCurrentPage(urlPage);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const urlParams = new URLSearchParams();
    if (searchTerm) urlParams.set('search', searchTerm);
    if (groupFilter) urlParams.set('group', groupFilter);
    if (consentStatusFilter) urlParams.set('consent', consentStatusFilter);
    if (currentPage > 1) urlParams.set('page', currentPage.toString());

    const newUrl = urlParams.toString() ? `${window.location.pathname}?${urlParams.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [searchTerm, groupFilter, consentStatusFilter, currentPage]);

  // Fetch data when filters or pagination changes
  useEffect(() => {
    const params: MRPaginationParams = {
      page: currentPage,
      limit: 30,
      ...searchFilters
    };

    if (searchTerm) params.search = searchTerm;
    if (groupFilter) params.groupId = groupFilter;
    if (consentStatusFilter) params.consentStatus = consentStatusFilter;
    
    // Add server-side sorting
    params.sortField = sortField;
    params.sortDirection = sortDirection;

    console.log('MRList: Fetching with params:', params);
    fetchContacts(params);
  }, [currentPage, searchTerm, groupFilter, consentStatusFilter, sortField, sortDirection, searchFilters, fetchContacts]);

  // Refresh data when refreshTrigger changes (after deletion)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      const params: MRPaginationParams = {
        page: currentPage,
        limit: 30
      };

      if (searchTerm) params.search = searchTerm;
      if (groupFilter) params.groupId = groupFilter;
      if (consentStatusFilter) params.consentStatus = consentStatusFilter;
      params.sortField = sortField;
      params.sortDirection = sortDirection;

      console.log('MRList: Refreshing after deletion with params:', params);
      fetchContacts(params);
    }
  }, [refreshTrigger, currentPage, searchTerm, groupFilter, consentStatusFilter, sortField, sortDirection, fetchContacts]);

  // Use contacts directly since sorting is now handled server-side
  const sortedContacts = contacts;

  // Create a wrapper function for delete that refreshes the list
  const handleDeleteWithRefresh = async (contact: Contact) => {
    // Call the original delete function
    await onDelete(contact);
    
    // Refresh the list data after successful deletion
    const params: MRPaginationParams = {
      page: currentPage,
      limit: 30
    };

    if (searchTerm) params.search = searchTerm;
    if (groupFilter) params.groupId = groupFilter;
    if (consentStatusFilter) params.consentStatus = consentStatusFilter;
    params.sortField = sortField;
    params.sortDirection = sortDirection;

    fetchContacts(params);
    
    // Also call the onRefresh callback if provided
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleSort = (field: keyof Contact) => {
    onSort(field);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExportAll = async () => {
    try {
      // Use filtered export if available, otherwise fallback to old method
      if (onFilteredExport) {
        await onFilteredExport(
          searchTerm,
          groupFilter,
          consentStatusFilter,
          sortField as string,
          sortDirection
        );
      } else {
        // Fallback to old method
        await fetchAllContacts(
          searchTerm,
          groupFilter,
          consentStatusFilter
        );
        // Call the parent's onDownloadCSV with all contacts
        if (onDownloadCSV) {
          onDownloadCSV();
        }
      }
    } catch (error) {
      console.error('Error exporting all contacts:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGroupFilter('');
    setConsentStatusFilter('');
    setSearchFilters({});
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Advanced Search */}
      <AdvancedSearch
        searchTerm={searchTerm}
        groupFilter={groupFilter}
        consentStatusFilter={consentStatusFilter}
        groups={groups}
        onSearchChange={(term) => {
          setSearchTerm(term);
          setCurrentPage(1); // Reset to first page
        }}
        onGroupChange={(groupId) => {
          setGroupFilter(groupId);
          setCurrentPage(1); // Reset to first page
        }}
        onConsentStatusChange={(consentStatus) => {
          setConsentStatusFilter(consentStatus);
          setCurrentPage(1); // Reset to first page
        }}
        onClearFilters={clearFilters}
        filteredCount={total ?? 0}
        totalCount={total ?? 0}
        onDownloadCSV={handleExportAll}
      />

      {/* MR Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <MRTable
          contacts={sortedContacts}
          onEdit={onEdit}
          onDelete={handleDeleteWithRefresh}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          loading={dataLoading || loading} // Use both loading states
        />

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <PaginationControls
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
        
        {/* Export Button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {(searchTerm || groupFilter || consentStatusFilter) ? (
                <>
                  Found [{total ?? 0}] filtered MR{(total ?? 0) !== 1 ? 's' : ''}
                  <span className="ml-1 text-gray-400">
                    (showing {contacts.length} on this page)
                  </span>
                </>
              ) : (
                <>
                  Total [{total ?? 0}] MR{(total ?? 0) !== 1 ? 's' : ''}
                  <span className="ml-1 text-gray-400">
                    (showing {contacts.length} on this page)
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-col items-end space-y-1">
              <button
                onClick={handleExportAll}
                disabled={dataLoading || loading}
                title={`Export ${total ?? 0} MRs with applied filters to CSV`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {dataLoading || loading ? 'Exporting...' : 'Export'}
              </button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MRList;
