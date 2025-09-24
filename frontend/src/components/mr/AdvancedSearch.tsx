import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Group } from '../../types/mr.types';

interface AdvancedSearchProps {
  searchTerm: string;
  groupFilter: string;
  groups: Group[];
  onSearchChange: (searchTerm: string) => void;
  onGroupChange: (groupFilter: string) => void;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
  onDownloadCSV?: () => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  searchTerm,
  groupFilter,
  groups,
  onSearchChange,
  onGroupChange,
  onClearFilters,
  filteredCount,
  totalCount,
  onDownloadCSV
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInput, setSearchInput] = useState(searchTerm);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onSearchChange('');
  };

  const hasActiveFilters = searchTerm || groupFilter;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Basic Search */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by MR ID, name, phone, or group..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center space-x-2 px-6 py-4 rounded-xl border transition-all duration-200 font-medium ${
            showAdvanced || hasActiveFilters
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          <Filter className="h-5 w-5" />
          <span>Advanced</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-6 space-y-6 transition-all duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Group Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Filter by Group
              </label>
              <select
                value={groupFilter}
                onChange={(e) => onGroupChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
              >
                <option value="">All Groups</option>
                {groups.map(group => (
                  <option key={group.id} value={group.name}>
                    {group.name} ({group.contactCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Results Summary and Download */}
            <div className="flex items-center justify-end space-x-4">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 rounded-xl border border-indigo-100">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-bold text-indigo-600">{filteredCount}</span> of{' '}
                  <span className="font-bold text-gray-900">{totalCount}</span> MRs
                </div>
              </div>
              
              {onDownloadCSV && (
                <button
                  onClick={onDownloadCSV}
                  className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={onClearFilters}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-all duration-200 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
                <span>Clear all filters</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Active Filters</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm">
                <Search className="h-3 w-3 mr-2" />
                <span className="font-medium">"{searchTerm}"</span>
                <button
                  onClick={() => {
                    setSearchInput('');
                    onSearchChange('');
                  }}
                  className="ml-2 hover:text-indigo-600 transition-colors duration-200 p-0.5 rounded-full hover:bg-indigo-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {groupFilter && (
              <span className="inline-flex items-center px-3 py-2 rounded-full text-sm bg-green-100 text-green-800 border border-green-200 shadow-sm">
                <Filter className="h-3 w-3 mr-2" />
                <span className="font-medium">{groupFilter}</span>
                <button
                  onClick={() => onGroupChange('')}
                  className="ml-2 hover:text-green-600 transition-colors duration-200 p-0.5 rounded-full hover:bg-green-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;