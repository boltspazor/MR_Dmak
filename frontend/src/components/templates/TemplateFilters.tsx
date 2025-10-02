import React from 'react';
import { Search, Filter } from 'lucide-react';

interface TemplateFiltersProps {
  nameSearchTerm: string;
  setNameSearchTerm: (term: string) => void;
  contentSearchTerm: string;
  setContentSearchTerm: (term: string) => void;
  templateFilter: 'all' | 'utility' | 'marketing';
  setTemplateFilter: (filter: 'all' | 'utility' | 'marketing') => void;
  filteredCount: number;
  totalCount: number;
}

const TemplateFilters: React.FC<TemplateFiltersProps> = ({
  nameSearchTerm,
  setNameSearchTerm,
  contentSearchTerm,
  setContentSearchTerm,
  templateFilter,
  setTemplateFilter,
  filteredCount,
  totalCount
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header with count */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filter & Search</h3>
        </div>
        <div className="bg-indigo-50 px-3 py-1 rounded-full">
          <span className="text-sm font-medium text-indigo-700">
            {filteredCount} of {totalCount} templates
          </span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Template Type:</label>
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value as 'all' | 'utility' | 'marketing')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Templates</option>
              <option value="utility">Utility</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>


        </div>
      </div>

      {/* Search Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by template name..."
            value={nameSearchTerm}
            onChange={(e) => setNameSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>
        <div className="relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by template content..."
            value={contentSearchTerm}
            onChange={(e) => setContentSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateFilters;
