import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationState } from '../../types/mr.types';

interface EnhancedPaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onFirst: () => void;
  onLast: () => void;
}

const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
  pagination,
  onPageChange,
  onPrevious,
  onNext,
  onFirst,
  onLast
}) => {
  const { currentPage, totalPages, startIndex, endIndex, itemsPerPage } = pagination;

  if (totalPages <= 1) return null;

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="flex items-center justify-between px-6 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
      {/* Results Info */}
      <div className="flex items-center text-sm text-gray-700">
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          <span>
            Showing <span className="font-bold text-indigo-600">{startIndex + 1}</span> to{' '}
            <span className="font-bold text-indigo-600">{endIndex}</span> of{' '}
            <span className="font-bold text-gray-900">{pagination.totalPages * itemsPerPage}</span> results
          </span>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* First Page */}
        <button
          onClick={onFirst}
          disabled={currentPage === 1}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-white rounded-lg border border-gray-200 hover:border-gray-300"
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous Page */}
        <button
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-white rounded-lg border border-gray-200 hover:border-gray-300"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex space-x-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500 font-medium">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 bg-white border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Page */}
        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-white rounded-lg border border-gray-200 hover:border-gray-300"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Page */}
        <button
          onClick={onLast}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-white rounded-lg border border-gray-200 hover:border-gray-300"
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Page Size Info */}
      <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-indigo-600">{itemsPerPage}</span> per page
        </div>
      </div>
    </div>
  );
};

export default EnhancedPagination;
