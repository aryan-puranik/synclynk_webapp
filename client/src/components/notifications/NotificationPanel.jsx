import React, { useState } from 'react';
import { FiBell, FiSettings, FiTrash2, FiCheck, FiFilter } from 'react-icons/fi';
import NotificationItem from './NotificationItem';
import NotificationSettings from './NotificationSettings';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationPanel = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getNotificationCount,
    supportedApps
  } = useNotifications();
  
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState('all');

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'all') return true;
    return notification.app === filter; // Filters by package name ID
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              <FiBell className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Notification Feed
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} NEW
              </span>
            )}
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => markAllAsRead()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
              title="Mark all read"
            >
              <FiCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() => clearNotifications()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
              title="Clear all"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-blue-50 text-blue-500' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Settings"
            >
              <FiSettings className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Dynamic App Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          <FiFilter className="w-3 h-3 text-gray-400 flex-shrink-0" />
          
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
            }`}
          >
            All
          </button>
          
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === 'unread' ? 'bg-red-600 text-white shadow-md shadow-red-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
            }`}
          >
            Unread ({unreadCount})
          </button>

          {supportedApps.map(app => {
            const count = getNotificationCount(app.id);
            if (count === 0 && filter !== app.id) return null; // Hide empty app filters unless active
            return (
              <button
                key={app.id}
                onClick={() => setFilter(app.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1 ${
                  filter === app.id ? 'text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                }`}
                style={filter === app.id ? { backgroundColor: app.color, boxShadow: `0 4px 12px ${app.color}40` } : {}}
              >
                <span>{app.icon}</span>
                <span>{app.name} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {showSettings && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <NotificationSettings />
        </div>
      )}
      
      <div className="max-h-[500px] overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="bg-gray-50 dark:bg-gray-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiBell className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-900 dark:text-white font-bold">No notifications found</p>
            <p className="text-sm text-gray-500 mt-1 max-w-[200px] mx-auto">
              Notifications from your paired device will appear here in real-time.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;