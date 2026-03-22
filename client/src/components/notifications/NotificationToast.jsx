import React, { useEffect } from 'react';
import toast from 'react-hot-toast';

export const showNotificationToast = (notification) => {
  // Custom toast with JSX
  toast.custom((t) => (
    <div
      className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-300 font-bold text-lg uppercase">
                {notification.app.charAt(0)}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.app.charAt(0).toUpperCase() + notification.app.slice(1)}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {notification.title}
            </p>
            {notification.message && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {notification.message}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Close
        </button>
      </div>
    </div>
  ), { duration: 5000 });
};

// Hook to listen for notifications and show custom toasts
export const useNotificationToasts = () => {
  useEffect(() => {
    const handleNewNotification = (event) => {
      const notification = event.detail;
      if (notification.priority === 'high' && !notification.read) {
        showNotificationToast(notification);
      }
    };

    window.addEventListener('new-notification', handleNewNotification);
    
    return () => {
      window.removeEventListener('new-notification', handleNewNotification);
    };
  }, []);
};