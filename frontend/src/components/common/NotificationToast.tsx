import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-success-400" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-danger-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-400" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-primary-400" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-primary-400" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success-50 border-success-200';
      case 'error':
        return 'bg-danger-50 border-danger-200';
      case 'warning':
        return 'bg-warning-50 border-warning-200';
      case 'info':
        return 'bg-primary-50 border-primary-200';
      default:
        return 'bg-primary-50 border-primary-200';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-success-800';
      case 'error':
        return 'text-danger-800';
      case 'warning':
        return 'text-warning-800';
      case 'info':
        return 'text-primary-800';
      default:
        return 'text-primary-800';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm w-full ${getBackgroundColor(notification.type)} border rounded-lg shadow-lg p-4 animate-slide-down`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${getTextColor(notification.type)}`}>
                {notification.title}
              </p>
              <p className={`mt-1 text-sm ${getTextColor(notification.type)} opacity-90`}>
                {notification.message}
              </p>
            </div>
            <div className="ml-4 flex flex-shrink-0">
              <button
                onClick={() => removeNotification(notification.id)}
                className={`inline-flex ${getTextColor(notification.type)} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${notification.type}-50 focus:ring-${notification.type}-500`}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
