import React from 'react';
import { Users, FileText, MessageSquare, BarChart3, Download } from 'lucide-react';

interface SummaryItem {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

interface CommonFeaturesProps {
  summaryItems: SummaryItem[];
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  children: React.ReactNode;
  showExportBlock?: boolean;
}

const CommonFeatures: React.FC<CommonFeaturesProps> = ({
  summaryItems,
  onExportCSV,
  onExportPDF,
  children,
  showExportBlock = true
}) => {
  return (
    <div className="space-y-8">
      {/* Summary Block */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {summaryItems.map((item, index) => (
          <div key={index} className="bg-white bg-opacity-60 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${item.color}`}>
                {item.icon}
              </div>
              <div className="ml-4">
                <p className="text-sm font-bold text-gray-600">{item.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-6 min-h-96">
        {children}
      </div>

      {/* Export Block */}
      {showExportBlock && (
        <div className="bg-white bg-opacity-60 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
          <div className="flex space-x-4">
            <button
              onClick={onExportCSV}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={onExportPDF}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonFeatures;
