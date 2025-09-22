import React, { useState } from 'react';
import RecipientListModal, { GroupMember } from '../ui/RecipientListModal';

interface RecipientListWithProgressProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
  campaignName?: string;
  recipients?: GroupMember[];
  onExportCSV?: () => void;
}

const RecipientListWithProgress: React.FC<RecipientListWithProgressProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  recipients = [],
  onExportCSV
}) => {
  return (
    <RecipientListModal
      isOpen={isOpen}
      onClose={onClose}
      recipients={recipients}
      campaignName={campaignName}
      campaignId={campaignId}
      showProgress={!!campaignId} // Only show progress if campaignId is provided
      onExportCSV={onExportCSV}
      showExportButton={true}
    />
  );
};

export default RecipientListWithProgress;
