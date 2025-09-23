import React, { useState } from 'react';
import { Eye, RefreshCw } from 'lucide-react';
import CampaignProgressTracker from './CampaignProgressTracker';

interface CampaignProgressButtonProps {
  campaignId: string;
  campaignName?: string;
  variant?: 'button' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CampaignProgressButton: React.FC<CampaignProgressButtonProps> = ({
  campaignId,
  campaignName,
  variant = 'button',
  size = 'md',
  className = ''
}) => {
  const [showTracker, setShowTracker] = useState(false);

  const handleClick = () => {
    setShowTracker(true);
  };

  const handleClose = () => {
    setShowTracker(false);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'icon':
        return 'p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors';
      case 'text':
        return 'text-indigo-600 hover:text-indigo-800 underline';
      default:
        return `bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors ${getSizeClasses()}`;
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`${getVariantClasses()} ${className} flex items-center`}
        title={`View progress for ${campaignName || 'campaign'}`}
      >
        {variant === 'icon' ? (
          <Eye className="w-4 h-4" />
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            View Progress
          </>
        )}
      </button>

      {/* Progress Tracker Modal */}
      {showTracker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <CampaignProgressTracker
              campaignId={campaignId}
              onClose={handleClose}
              autoRefresh={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CampaignProgressButton;
