import React, { useMemo } from 'react';
import { Contact, Group } from '../../types/mr.types';
import AdvancedSearch from './AdvancedSearch';
import MRTable from './MRTable';
import EnhancedPagination from './EnhancedPagination';
import { useMRFilters } from '../../hooks/useMRFilters';
import { useMRPagination } from '../../hooks/useMRPagination';

interface MRListProps {
  contacts: Contact[];
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
  contacts,
  groups,
  onEdit,
  onDelete,
  onSort,
  sortField,
  sortDirection,
  loading = false,
  onDownloadCSV
}) => {
  const {
    filters,
    filteredContacts,
    updateSearchTerm,
    updateGroupFilter,
    clearFilters
  } = useMRFilters(contacts);

  // Apply parent's sorting to filtered contacts
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredContacts, sortField, sortDirection]);

  const pagination = useMRPagination({
    totalItems: sortedContacts.length,
    itemsPerPage: 50
  });

  const paginatedContacts = sortedContacts.slice(
    pagination.startIndex,
    pagination.endIndex
  );

  const handleSort = (field: keyof Contact) => {
    onSort(field);
  };

  return (
    <div className="space-y-6">
      {/* Advanced Search */}
      <AdvancedSearch
        searchTerm={filters.searchTerm}
        groupFilter={filters.groupFilter}
        groups={groups}
        onSearchChange={updateSearchTerm}
        onGroupChange={updateGroupFilter}
        onClearFilters={clearFilters}
        filteredCount={filteredContacts.length}
        totalCount={contacts.length}
        onDownloadCSV={onDownloadCSV}
      />

      {/* MR Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <MRTable
          contacts={paginatedContacts}
          onEdit={onEdit}
          onDelete={onDelete}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          loading={loading}
        />

        {/* Enhanced Pagination */}
        <EnhancedPagination
          pagination={pagination}
          onPageChange={pagination.goToPage}
          onPrevious={pagination.goToPreviousPage}
          onNext={pagination.goToNextPage}
          onFirst={pagination.goToFirstPage}
          onLast={pagination.goToLastPage}
        />
      </div>
    </div>
  );
};

export default MRList;
