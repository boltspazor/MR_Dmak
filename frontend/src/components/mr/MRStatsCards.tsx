import React from 'react';
import { Users, FileText } from 'lucide-react';
import { SkeletonStats } from '../ui/SkeletonLoader';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  textColor: string;
}

interface MRStatsCardsProps {
  summaryItems: StatCard[];
  loading?: boolean;
}

const iconMap = {
  Users: Users,
  FileText: FileText,
};

const MRStatsCards: React.FC<MRStatsCardsProps> = ({ summaryItems, loading = false }) => {
  if (loading) {
    return <SkeletonStats />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {summaryItems.map((item, index) => {
        const IconComponent = iconMap[item.icon as keyof typeof iconMap];
        
        return (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className={`p-3 ${item.color} rounded-lg`}>
                <IconComponent className={`h-6 w-6 ${item.textColor}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{item.title}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MRStatsCards;
