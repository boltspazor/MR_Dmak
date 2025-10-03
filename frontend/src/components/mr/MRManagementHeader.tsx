import React from 'react';
import StandardHeader from '../StandardHeader';
import MRStatsCards from './MRStatsCards';

interface MRManagementHeaderProps {
  totalCount: number;
  filteredCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddMR: () => void;
  summaryItems: {
    title: string;
    value: number;
    icon: string;
    color: string;
    textColor: string;
  }[];
  loading: boolean;
}

const MRManagementHeader: React.FC<MRManagementHeaderProps> = ({
  summaryItems,
  loading
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
