import React from 'react';
import { Search } from 'lucide-react';

interface MRSearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
}

const MRSearchAndFilter: React.FC<MRSearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  filteredCount,
  totalCount
}) => {
  return (
    <div className="p-6 border-b bg-indigo-50">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-700 font-bold">
          {filteredCount} of {totalCount}
        </span>
      </div>
      
      {/* Search Controls */}
      <div className="grid grid-cols-1 gap-4">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts by name, MR ID, phone, or group..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default MRSearchAndFilter;
