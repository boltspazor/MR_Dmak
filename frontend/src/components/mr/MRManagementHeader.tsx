import React from 'react';
import StandardHeader from '../StandardHeader';
import MRStatsCards from './MRStatsCards';

interface MRManagementHeaderProps {
  totalCount: number;
  filteredCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddMR: () => void;
  originalSummaryItems: {
    title: string;
    value: number;
    icon: string;
    color: string;
    textColor: string;
  }[];
  consentSummaryItems: {
    title: string;
    value: number;
    icon: string;
    color: string;
    textColor: string;
  }[];
  loading: boolean;
}

const MRManagementHeader: React.FC<MRManagementHeaderProps> = ({
  originalSummaryItems,
  consentSummaryItems,
  loading
}) => {
  return (
    <>
      <StandardHeader pageTitle="MR Management" />
      <div className="space-y-6 mb-8">
        {/* Original Summary Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">MR Overview</h3>
          <MRStatsCards summaryItems={originalSummaryItems} loading={loading} />
        </div>
        
        {/* Consent Status Summary Section */}
        <div>
          <MRStatsCards summaryItems={consentSummaryItems} loading={loading} />
        </div>
      </div>
    </>
  );
};

export default MRManagementHeader;
