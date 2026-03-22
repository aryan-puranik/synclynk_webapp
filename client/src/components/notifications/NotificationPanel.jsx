import React, { useState, useEffect } from 'react';
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
    getNotificationCount
  } = useNotifications();
  
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, whatsapp, telegram, etc.

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'whatsapp') return notification.app === 'whatsapp';
    if (filter === 'telegram') return notification.app === 'telegram';
    if (filter === 'signal') return notification.app === 'signal';
    return true;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FiBell className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={markAllAsRead}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Mark all as read"
            >
              <FiCheck className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            
            <button
              onClick={() => clearNotifications()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Clear all"
            >
              <FiTrash2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Settings"
            >
              <FiSettings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          <FiFilter className="w-4 h-4 text-gray-400" />
          
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            All
          </button>
          
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'unread'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Unread ({unreadCount})
          </button>
          
          <button
            onClick={() => setFilter('whatsapp')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'whatsapp'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            WhatsApp ({getNotificationCount('whatsapp')})
          </button>
          
          <button
            onClick={() => setFilter('telegram')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'telegram'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Telegram ({getNotificationCount('telegram')})
          </button>
          
          <button
            onClick={() => setFilter('signal')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'signal'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Signal ({getNotificationCount('signal')})
          </button>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <NotificationSettings />
        </div>
      )}
      
      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <FiBell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Notifications from messaging apps will appear here
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