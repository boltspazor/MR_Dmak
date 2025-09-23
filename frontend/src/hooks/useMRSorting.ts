import { useState, useCallback } from 'react';
import { Contact } from '../types/mr.types';

export const useMRSorting = () => {
  const [sortField, setSortField] = useState<keyof Contact>('mrId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = useCallback((field: keyof Contact) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  return {
    sortField,
    sortDirection,
    handleSort
  };
};
