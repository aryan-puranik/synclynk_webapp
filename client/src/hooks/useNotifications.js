// src/hooks/useNotifications.js
import { useState, useCallback, useEffect, useRef } from 'react';
import socketService from '../services/socketService';
import storageService from '../services/storageService';
import { useSocket } from './useSocket';


export const useNotifications = () => {
  const { socket, roomId, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [settings, setSettings] = useState(() => {
    const savedSettings = storageService.getItem('notificationSettings');
    return savedSettings || {
      enabled: true,
      apps: [
        'com.whatsapp', 
        'com.whatsapp.w4b', 
        'org.telegram.messenger', 
        'com.discord', 
        'com.slack', 
        'com.facebook.orca',
        'com.google.android.gm',
        'com.google.android.apps.messaging'
      ],
      doNotDisturb: false,
      dndStart: '22:00',
      dndEnd: '08:00',
      showPreview: true,
      soundEnabled: true,
      priorityOnly: false
    };
  });

  const settingsRef = useRef(settings);
  const notificationsRef = useRef(notifications);
  
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);

  const supportedApps = [
    { id: 'com.whatsapp',                      name: 'WhatsApp',          icon: '💬', color: '#25D366' },
    { id: 'com.whatsapp.w4b',                  name: 'WhatsApp Business', icon: '💼', color: '#075E54' },
    { id: 'org.telegram.messenger',            name: 'Telegram',          icon: '✈️', color: '#26A5E4' },
    { id: 'com.discord',                       name: 'Discord',           icon: '🎮', color: '#5865F2' },
    { id: 'com.slack',                         name: 'Slack',             icon: '💼', color: '#4A154B' },
    { id: 'com.facebook.orca',                 name: 'Messenger',         icon: '🔵', color: '#0084FF' },
    { id: 'com.google.android.apps.messaging', name: 'Messages',         icon: '🔵', color: '#0084FF' },
    { id: 'com.instagram.android',             name: 'Instagram',         icon: '📸', color: '#E4405F' },
    { id: 'com.google.android.gm',             name: 'Gmail',             icon: '✉️', color: '#D44638' },
  ];

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getAppName = (appId) => {
    const app = supportedApps.find(a => a.id === appId);
    if (app) return app.name;
    const parts = appId.split('.');
    const last = parts[parts.length - 1];
    return last ? last.charAt(0).toUpperCase() + last.slice(1) : appId;
  };

  const getAppIcon = (appId) => {
    const app = supportedApps.find(a => a.id === appId);
    return app ? app.icon : '🔔';
  };

  const getAppColor = (appId) => {
    const app = supportedApps.find(a => a.id === appId);
    return app ? app.color : '#6B7280';
  };

  // ─── Initial Data Fetch ───────────────────────────────────────────────────
  // Separate effect to fix "socket not connected" error
  useEffect(() => {
    if (isConnected && roomId) {
      socketService.getNotificationSettings(roomId);
      socketService.getNotifications(roomId, { limit: 50 });
    }
  }, [isConnected, roomId]);

  // ─── Event Handlers ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId) return;

    // Define all handlers first to prevent ReferenceErrors
    const handleNotification = (notification) => {
      const currentSettings = settingsRef.current;
      const currentNotifications = notificationsRef.current;

      // Deduplication check
      const isDuplicate = currentNotifications.some(n => n.id === notification.id);
      if (isDuplicate) return;

      if (currentSettings.doNotDisturb) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const dndStart = parseTimeToMinutes(currentSettings.dndStart);
        const dndEnd   = parseTimeToMinutes(currentSettings.dndEnd);
        if (currentTime >= dndStart && currentTime < dndEnd) return;
      }

      if (currentSettings.apps.length > 0 && !currentSettings.apps.includes(notification.app)) {
        return;
      }

      setNotifications(prev => [notification, ...prev].slice(0, 100));
      setUnreadCount(prev => prev + 1);

    };

    const handleSettingsUpdate = (newSettings) => {
      setSettings(newSettings);
      storageService.setItem('notificationSettings', newSettings);
    };

    const handleNotificationsHistory = (history) => {
      setNotifications(history);
      setUnreadCount(history.filter(n => !n.read).length);
      setIsLoading(false);
    };

    const handleNotificationRead = ({ notificationId, read, readAt }) => {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read, readAt } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleNotificationsAllRead = ({ app }) => {
      setNotifications(prev => prev.map(n => (!app || n.app === app) ? { ...n, read: true } : n));
      const count = notificationsRef.current.filter(n => (!app || n.app === app) && !n.read).length;
      setUnreadCount(prev => Math.max(0, prev - count));
    };

    const handleNotificationsCleared = ({ app }) => {
      setNotifications(prev => app ? prev.filter(n => n.app !== app) : []);
      const removed = notificationsRef.current.filter(n => (!app || n.app === app) && !n.read).length;
      setUnreadCount(prev => Math.max(0, prev - removed));
    };

    // Register listeners AFTER they are defined
    socket.on('notification',               handleNotification);
    socket.on('notification-settings',      handleSettingsUpdate);
    socket.on('notifications-history',      handleNotificationsHistory);
    socket.on('notification-read-status',   handleNotificationRead);
    socket.on('notifications-all-read',     handleNotificationsAllRead);
    socket.on('notifications-cleared',      handleNotificationsCleared);

    return () => {
      socket.off('notification',              handleNotification);
      socket.off('notification-settings',     handleSettingsUpdate);
      socket.off('notifications-history',     handleNotificationsHistory);
      socket.off('notification-read-status',  handleNotificationRead);
      socket.off('notifications-all-read',    handleNotificationsAllRead);
      socket.off('notifications-cleared',     handleNotificationsCleared);
    };
  }, [socket, roomId]);

  // ─── Public API ───────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (newSettings) => {
    if (!socket || !roomId) return;
    const updated = { ...settingsRef.current, ...newSettings };
    setSettings(updated);
    storageService.setItem('notificationSettings', updated);
    socketService.updateNotificationSettings(roomId, updated);
  }, [socket, roomId]);

  const markAsRead = (id) => socketService.markNotificationRead(roomId, id);
  const clearNotifications = (app = null) => socketService.clearNotifications(roomId, app);
  const getNotificationCount = (app) => notifications.filter(n => n.app === app && !n.read).length;
  const toggleDND = (enabled, start, end) => socket.emit('notification-dnd-toggle', { roomId, enabled, startTime: start, endTime: end });

  const sendTestNotification = useCallback(async (app = 'com.whatsapp') => {
    if (!socket || !roomId) return;
    socketService.sendNotification(roomId, {
      app,
      appName: getAppName(app),
      title: 'Test Notification',
      body: 'Synclynk is working!',
      timestamp: Date.now()
    });
  }, [socket, roomId]);

  return {
    notifications,
    settings,
    unreadCount,
    isLoading,
    supportedApps,
    updateSettings,
    markAsRead,
    clearNotifications,
    getNotificationCount,
    toggleDND,
    sendTestNotification,
    getAppName,
    getAppIcon,
    getAppColor
  };
};