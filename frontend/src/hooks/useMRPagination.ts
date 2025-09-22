import { useState, useEffect, useMemo } from 'react';
import { PaginationState } from '../types/mr.types';

interface UsePaginationProps {
  totalItems: number;
  itemsPerPage?: number;
}

export const useMRPagination = ({ totalItems, itemsPerPage = 50 }: UsePaginationProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const pagination = useMemo((): PaginationState => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return {
      currentPage,
      itemsPerPage,
      totalPages,
      startIndex,
      endIndex
    };
  }, [currentPage, itemsPerPage, totalItems]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, pagination.totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(pagination.totalPages);
  };

  // Reset to first page when total items change
  useEffect(() => {
    setCurrentPage(1);
  }, [totalItems]);

  return {
    ...pagination,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage
  };
};
