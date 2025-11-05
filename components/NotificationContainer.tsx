import React, { useState, useEffect } from 'react';
import { notificationManager, Notification } from '../lib/notifications';

const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const handleClose = (id: string) => {
    notificationManager.remove(id);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => handleClose(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const getIconAndColors = () => {
    switch (notification.type) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          titleColor: 'text-green-900'
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          titleColor: 'text-red-900'
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          titleColor: 'text-yellow-900'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          titleColor: 'text-blue-900'
        };
      default:
        return {
          icon: 'ℹ️',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          titleColor: 'text-gray-900'
        };
    }
  };

  const { icon, bgColor, borderColor, textColor, titleColor } = getIconAndColors();

  return (
    <div className={`
      ${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 min-w-80 max-w-96
      animate-in slide-in-from-right-5 duration-300
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-lg">{icon}</span>
          <div className="flex-1">
            <h4 className={`font-medium ${titleColor}`}>
              {notification.title}
            </h4>
            {notification.message && (
              <p className={`text-sm mt-1 ${textColor}`}>
                {notification.message}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className={`ml-2 ${textColor} hover:bg-gray-200 rounded p-1 text-sm`}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default NotificationContainer; 