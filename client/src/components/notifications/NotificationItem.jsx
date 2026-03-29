import React from 'react';
import { FiCheck, FiBell } from 'react-icons/fi';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const { getAppName, getAppIcon, getAppColor } = useNotifications();
  
  // Retrieve consistent metadata from the hook
  const appName = getAppName(notification.app);
  const appIcon = getAppIcon(notification.app);
  const appColor = getAppColor(notification.app);
  
  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
      <div className="flex items-start space-x-3">
        {/* Dynamic App Icon and Color */}
        <div className="flex-shrink-0">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm"
            style={{ backgroundColor: `${appColor}15`, border: `1px solid ${appColor}30` }}
          >
            <span style={{ color: appColor }}>{appIcon}</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: appColor }}>
              {appName}
            </p>
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">
              {getTimeAgo(notification.timestamp)}
            </p>
          </div>
          
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
            {notification.title}
          </p>
          
          {/* Changed 'message' to 'body' to match native payload */}
          {notification.body && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {notification.body}
            </p>
          )}
          
          {!notification.read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 mt-2"
            >
              <FiCheck className="w-3 h-3" />
              <span>Mark as read</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;