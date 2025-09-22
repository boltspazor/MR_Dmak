import React, { createContext, useContext, useState, ReactNode } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface ConfirmOptions {
  title: string;
  message: string;
  type?: 'confirm' | 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

interface ConfirmProviderProps {
  children: ReactNode;
}

export const ConfirmProvider: React.FC<ConfirmProviderProps> = ({ children }) => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: { title: '', message: '' },
    resolve: null
  });

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options: {
          type: 'confirm',
          showCancel: true,
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          ...options
        },
        resolve
      });
    });
  };

  const alert = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): Promise<void> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options: {
          title: type === 'success' ? 'Success' : 
                type === 'error' ? 'Error' : 
                type === 'warning' ? 'Warning' : 'Information',
          message,
          type,
          showCancel: false,
          confirmText: 'OK'
        },
        resolve: () => resolve()
      });
    });
  };

  const handleClose = () => {
    setDialogState(prev => ({
      ...prev,
      isOpen: false,
      resolve: null
    }));
  };

  const handleConfirm = () => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    handleClose();
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={dialogState.options.title}
        message={dialogState.options.message}
        type={dialogState.options.type}
        confirmText={dialogState.options.confirmText}
        cancelText={dialogState.options.cancelText}
        showCancel={dialogState.options.showCancel}
      />
    </ConfirmContext.Provider>
  );
};
