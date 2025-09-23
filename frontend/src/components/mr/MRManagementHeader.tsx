import React from 'react';
import Header from '../Header';
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
      {/* Header */}
      <div className="mb-8">
        <Header
          title="D-MAK"
          subtitle="Digital - Marketing, Automate & Konnect"
          onExportCSV={onExportCSV}
          onExportPDF={onExportPDF}
          showExportButtons={false}
        />
      </div>

      {/* MR Management Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">MR Management</h2>
          </div>
        </div>
        
        {/* Stats Cards */}
        <MRStatsCards summaryItems={summaryItems} loading={loading} />
      </div>
    </>
  );
};

export default MRManagementHeader;
