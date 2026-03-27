import React from 'react';
import { FiCheck, FiBell, FiMessageCircle, FiMail, FiTwitter, FiInstagram } from 'react-icons/fi';

const appIcons = {
  whatsapp: FiMessageCircle,
  telegram: FiMessageCircle,
  signal: FiMessageCircle,
  discord: FiMessageCircle,
  slack: FiMail,
  messenger: FiMessageCircle,
  instagram: FiInstagram,
  twitter: FiTwitter
};

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const Icon = appIcons[notification.app] || FiBell;
  
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
    <div className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            !notification.read ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <Icon className={`w-5 h-5 ${
              !notification.read ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
            }`} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {notification.app.charAt(0).toUpperCase() + notification.app.slice(1)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getTimeAgo(notification.timestamp)}
            </p>
          </div>
          
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            {notification.title}
          </p>
          
          {notification.message && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {notification.message}
            </p>
          )}
          
          {!notification.read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1 mt-1"
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