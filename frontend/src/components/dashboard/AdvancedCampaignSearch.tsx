import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { campaignsAPI } from '../../api/campaigns-new';
import { CAMPAIGN_STATUSES } from '../../types/campaign.types';

interface AdvancedCampaignSearchProps {
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (searchTerm: string) => void;
  onStatusChange: (status: string) => void;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
  onDownloadCSV?: () => void;
}

const AdvancedCampaignSearch: React.FC<AdvancedCampaignSearchProps> = ({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onClearFilters,
  filteredCount,
  totalCount,
  onDownloadCSV
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [availableStatuses, setAvailableStatuses] = useState<Array<{value: string, label: string}>>(
    CAMPAIGN_STATUSES.map(s => ({ value: s.value, label: s.label }))
  );
  const [overallTotal, setOverallTotal] = useState<number | null>(totalCount ?? null);

  // Fetch available statuses from backend
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const statuses = await campaignsAPI.getAvailableStatuses();
        const statusOptions = [
          { value: '', label: 'All Statuses' },
          ...statuses.filter(s => ['pending', 'in-progress', 'completed', 'failed'].includes(s.value)).map(s => ({ 
            value: s.value, 
            label: s.label 
          }))
        ];
        setAvailableStatuses(statusOptions);
        console.log('🔍 Frontend - Loaded statuses:', statusOptions);
      } catch (error) {
        console.error('Failed to fetch statuses:', error);
        // Keep default statuses if API fails
      }
    };
    fetchStatuses();
  }, []);

  // Sync searchInput with searchTerm prop
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  // Fetch overall unfiltered campaign total from backend
  useEffect(() => {
    let mounted = true;
    const loadOverall = async () => {
      try {
        // Prefer the lightweight endpoint
        const res = await campaignsAPI.getCampaignTotalCount();
        if (mounted && res && typeof res.total === 'number') {
          setOverallTotal(res.total);
          return;
        }

        // Fallback
        const fallback = await campaignsAPI.getCampaignCount();
        if (mounted && fallback && typeof fallback.total === 'number') {
          setOverallTotal(fallback.total);
        }
      } catch (err) {
        console.warn('Failed to load overall campaign total:', err);
        // keep prop fallback
      }
    };
    loadOverall();
    return () => { mounted = false; };
  }, []);

  // Real-time search with debounce
  useEffect(() => {
    console.log('🔍 AdvancedCampaignSearch - searchInput changed:', searchInput, 'current searchTerm:', searchTerm);
    const timeoutId = setTimeout(() => {
      const trimmedInput = searchInput.trim();
      console.log('🔍 AdvancedCampaignSearch - triggering onSearchChange with:', trimmedInput);
      onSearchChange(trimmedInput);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchInput, onSearchChange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onSearchChange('');
  };

  const handleSearchChange = (value: string) => {
    console.log('AdvancedCampaignSearch - handleSearchChange called with:', value);
    setSearchInput(value);
  };

  const hasActiveFilters = searchTerm || statusFilter;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Basic Search */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by campaign name, template name, or recipient list name..."
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
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Filter by Campaign Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  console.log('🔍 AdvancedCampaignSearch - Status changed from:', statusFilter, 'to:', newStatus);
                  onStatusChange(newStatus);
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
              >
                {availableStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Spacer for alignment */}
            <div></div>
            <div></div>
          </div>

          {/* Results Summary and Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 rounded-xl border border-indigo-100">
              <div className="text-sm text-gray-700">
                {hasActiveFilters ? (
                  <>
                    Showing <span className="font-bold text-indigo-600">{filteredCount}</span> out of{' '}
                    <span className="font-bold text-gray-900">{overallTotal ?? totalCount}</span> total campaigns
                  </>
                ) : (
                  <>
                    Showing <span className="font-bold text-indigo-600">{filteredCount}</span>{' '}
                    {filteredCount === 1 ? 'campaign' : 'campaigns'}
                  </>
                )}
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

              {onDownloadCSV && (
                <button
                  onClick={onDownloadCSV}
                  className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export CSV</span>
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
                {statusFilter && (
                  <span className="px-2 py-1 bg-white rounded-md border border-indigo-200">
                    Status: {availableStatuses.find(s => s.value === statusFilter)?.label || statusFilter}
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

export default AdvancedCampaignSearch;