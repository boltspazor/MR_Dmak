import React from 'react';
import StandardHeader from '../StandardHeader';
import MRStatsCards from './MRStatsCards';

interface MRManagementHeaderProps {
  totalCount: number;
  filteredCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddMR: () => void;
  summaryItems?: any[];
  loading?: boolean;
}

const MRManagementHeader: React.FC<MRManagementHeaderProps> = ({
  totalCount,
  filteredCount,
  summaryItems = [],
  loading = false
}) => {
  return (
    <>
      <StandardHeader pageTitle="MR Management" />
      <div className="mb-8">
        <MRStatsCards summaryItems={summaryItems} loading={loading} />
      </div>
    </>
  );
};

export default MRManagementHeader;
