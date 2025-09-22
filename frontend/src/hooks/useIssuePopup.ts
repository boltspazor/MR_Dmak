import { useState } from 'react';

interface IssuePopupState {
  isOpen: boolean;
  title: string;
  issues: string[];
  type: 'error' | 'success' | 'warning' | 'info';
}

export const useIssuePopup = () => {
  const [popupState, setPopupState] = useState<IssuePopupState>({
    isOpen: false,
    title: '',
    issues: [],
    type: 'error'
  });

  const showError = (title: string, issues: string | string[]) => {
    setPopupState({
      isOpen: true,
      title,
      issues: Array.isArray(issues) ? issues : [issues],
      type: 'error'
    });
  };

  const showSuccess = (title: string, issues: string | string[]) => {
    setPopupState({
      isOpen: true,
      title,
      issues: Array.isArray(issues) ? issues : [issues],
      type: 'success'
    });
  };

  const showWarning = (title: string, issues: string | string[]) => {
    setPopupState({
      isOpen: true,
      title,
      issues: Array.isArray(issues) ? issues : [issues],
      type: 'warning'
    });
  };

  const showInfo = (title: string, issues: string | string[]) => {
    setPopupState({
      isOpen: true,
      title,
      issues: Array.isArray(issues) ? issues : [issues],
      type: 'info'
    });
  };

  const closePopup = () => {
    setPopupState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    popupState,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    closePopup
  };
};


