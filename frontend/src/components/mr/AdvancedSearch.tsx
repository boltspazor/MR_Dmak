import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Group } from '../../types/mr.types';

interface AdvancedSearchProps {
  searchTerm: string;
  groupFilter: string;
  consentStatusFilter: string;
  metaStatusFilter: string;
  groups: Group[];
  onSearchChange: (searchTerm: string) => void;
  onGroupChange: (groupFilter: string) => void;
  onConsentStatusChange: (consentStatus: string) => void;
  onMetaStatusChange: (metaStatus: string) => void;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  searchTerm,
  groupFilter,
  consentStatusFilter,
  metaStatusFilter,
  groups,
  onSearchChange,
  onGroupChange,
  onConsentStatusChange,
  onMetaStatusChange,
  onClearFilters,
  filteredCount,
  totalCount
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInput, setSearchInput] = useState(searchTerm);

  // Sync searchInput with searchTerm prop
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onSearchChange('');
  };

  // Real-time search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== searchTerm) {
        onSearchChange(searchInput);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchInput, searchTerm, onSearchChange]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const hasActiveFilters = searchTerm || groupFilter || consentStatusFilter || metaStatusFilter;

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
              onChange={(e) => handleSearchChange(e.target.value)}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.contactCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Consent Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Filter by Consent Status
              </label>
              <select
                value={consentStatusFilter}
                onChange={(e) => onConsentStatusChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
              >
                <option value="">All Consent Status</option>
                <option value="approved">Approved</option>
                <option value="not_requested">Not Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Meta Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Filter by Meta Status
              </label>
              <select
                value={metaStatusFilter}
                onChange={(e) => onMetaStatusChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
              >
                <option value="">All Meta Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ERROR">Error</option>
              </select>
            </div>
          </div>

          {/* Results Summary and Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 rounded-xl border border-indigo-100">
              <div className="text-sm text-gray-700">
                Showing <span className="font-bold text-indigo-600">{filteredCount}</span> of{' '}
                <span className="font-bold text-gray-900">{totalCount}</span> MRs
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-all duration-200 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && !showAdvanced && (
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-indigo-700">
              <span className="font-medium">Active Filters:</span>
              <div className="flex items-center space-x-2">
                {searchTerm && (
                  <span className="px-2 py-1 bg-white rounded-md border border-indigo-200">
                    Search: "{searchTerm}"
                  </span>
                )}
                {groupFilter && (
                  <span className="px-2 py-1 bg-white rounded-md border border-indigo-200">
                    Group: {groups.find(g => g.id === groupFilter)?.name || groupFilter}
                  </span>
                )}
                {metaStatusFilter && (
                  <span className="px-2 py-1 bg-white rounded-md border border-indigo-200">
                    Meta Status: {metaStatusFilter === 'ACTIVE' ? 'Active' : 'Error'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
