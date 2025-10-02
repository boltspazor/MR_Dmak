import React from 'react';
import StandardHeader from '../StandardHeader';
import MRStatsCards from './MRStatsCards';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  textColor: string;
}

interface MRManagementHeaderProps {
  summaryItems: StatCard[];
  onExportCSV: () => void;
  onExportPDF: () => void;
  loading?: boolean;
}

const MRManagementHeader: React.FC<MRManagementHeaderProps> = ({
  summaryItems,
  onExportCSV,
  onExportPDF,
  loading = false
}) => {
  return (
    <>
      {/* Standardized Header */}
      <StandardHeader pageTitle="MR Management" />

      {/* Stats Cards */}
      <div className="mb-8">
        <MRStatsCards summaryItems={summaryItems} loading={loading} />
      </div>
    </>
  );
};

export default MRManagementHeader;
