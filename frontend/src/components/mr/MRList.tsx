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
  onFilteredExport
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

  // Use contacts directly since sorting is now handled server-side
  const sortedContacts = contacts;

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
        filteredCount={contacts.length}
        totalCount={total}
        onDownloadCSV={handleExportAll}
      />

      {/* MR Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <MRTable
          contacts={sortedContacts}
          onEdit={onEdit}
          onDelete={onDelete}
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
      </div>
    </div>
  );
};

export default MRList;
