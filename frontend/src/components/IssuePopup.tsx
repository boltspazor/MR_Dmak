import React from 'react';

interface IssuePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  issues: string[];
  type?: 'error' | 'success' | 'warning' | 'info';
}

const IssuePopup: React.FC<IssuePopupProps> = ({
  isOpen,
  onClose,
  title,
  issues,
  type = 'error'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'border-green-500 bg-green-50',
          title: 'text-green-800',
          icon: 'text-green-600',
          listItem: 'text-green-700'
        };
      case 'warning':
        return {
          container: 'border-yellow-500 bg-yellow-50',
          title: 'text-yellow-800',
          icon: 'text-yellow-600',
          listItem: 'text-yellow-700'
        };
      case 'info':
        return {
          container: 'border-blue-500 bg-blue-50',
          title: 'text-blue-800',
          icon: 'text-blue-600',
          listItem: 'text-blue-700'
        };
      default: // error
        return {
          container: 'border-red-500 bg-red-50',
          title: 'text-red-800',
          icon: 'text-red-600',
          listItem: 'text-red-700'
        };
    }
  };

  const styles = getTypeStyles();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default: // error
        return '❌';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`max-w-md w-full mx-4 p-6 rounded-lg border-2 ${styles.container} shadow-xl`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${styles.title} flex items-center gap-2`}>
            <span className={`text-xl ${styles.icon}`}>{getIcon()}</span>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-2">
          <ul className="space-y-2">
            {issues.map((issue, index) => (
              <li key={index} className={`flex items-start gap-2 ${styles.listItem}`}>
                <span className="text-sm font-medium mt-0.5">{index + 1}.</span>
                <span className="text-sm">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssuePopup;
