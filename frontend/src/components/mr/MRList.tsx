import React, { useMemo, useState, useEffect } from 'react';
import { Contact, Group } from '../../types/mr.types';
import AdvancedSearch from './AdvancedSearch';
import MRTable from './MRTable';
import {PaginationControls} from '../PaginationControls';
import { useMRFilters } from '../../hooks/useMRFilters';
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
}

const MRList: React.FC<MRListProps> = ({
  groups,
  onEdit,
  onDelete,
  onSort,
  sortField,
  sortDirection,
  loading = false,
  onDownloadCSV
}) => {
  // Use contacts from the hook instead of props
  const { contacts, fetchContacts, fetchAllContacts, pagination, total, loading: dataLoading } = useMRData();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState<MRPaginationParams>({});

  // Remove useMRFilters since we're doing server-side filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  // Fetch data when filters or pagination changes
  useEffect(() => {
    const params: MRPaginationParams = {
      page: currentPage,
      limit: 30,
      ...searchFilters
    };

    if (searchTerm) params.search = searchTerm;
    if (groupFilter) params.groupId = groupFilter;

    console.log('MRList: Fetching with params:', params);
    fetchContacts(params);
  }, [currentPage, searchTerm, groupFilter, searchFilters, fetchContacts]);

  // Apply sorting to the fetched contacts (client-side sorting)
  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [contacts, sortField, sortDirection]);

  const handleSort = (field: keyof Contact) => {
    onSort(field);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExportAll = async () => {
    try {
      const allContacts = await fetchAllContacts(
        searchTerm,
        groupFilter
      );
      // Call the parent's onDownloadCSV with all contacts
      if (onDownloadCSV) {
        onDownloadCSV();
      }
    } catch (error) {
      console.error('Error exporting all contacts:', error);
    }
  };

  const handleFilterChange = (newFilters: MRPaginationParams) => {
    setSearchFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGroupFilter('');
    setSearchFilters({});
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Advanced Search */}
      <AdvancedSearch
        searchTerm={searchTerm}
        groupFilter={groupFilter}
        groups={groups}
        onSearchChange={(term) => {
          setSearchTerm(term);
          setCurrentPage(1); // Reset to first page
        }}
        onGroupChange={(groupId) => {
          setGroupFilter(groupId);
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
