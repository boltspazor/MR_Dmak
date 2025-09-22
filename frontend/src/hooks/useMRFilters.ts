import { useState, useMemo } from 'react';
import { Contact, SearchFilters } from '../types/mr.types';

export const useMRFilters = (contacts: Contact[]) => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    groupFilter: '',
    sortField: 'mrId',
    sortDirection: 'asc'
  });

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Search term filter
      const matchesSearch = contact.firstName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        contact.lastName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        contact.mrId.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        contact.phone.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        contact.group.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      // Group filter
      const matchesGroup = !filters.groupFilter || contact.group === filters.groupFilter;
      
      return matchesSearch && matchesGroup;
    });
  }, [contacts, filters]);

  const updateSearchTerm = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  };

  const updateGroupFilter = (groupFilter: string) => {
    setFilters(prev => ({ ...prev, groupFilter }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      groupFilter: '',
      sortField: 'mrId',
      sortDirection: 'asc'
    });
  };

  return {
    filters,
    filteredContacts,
    updateSearchTerm,
    updateGroupFilter,
    clearFilters
  };
};
