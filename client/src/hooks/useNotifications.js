import { useState, useCallback, useEffect, useRef } from 'react';
import socketService from '../services/socketService';
import storageService from '../services/storageService';
import { useSocket } from './useSocket';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const { socket, roomId, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(() => {
    const savedSettings = storageService.getItem('notificationSettings');
    return savedSettings || {
      enabled: true,
      apps: ['whatsapp', 'telegram', 'signal', 'discord', 'slack', 'messenger'],
      doNotDisturb: false,
      dndStart: '22:00',
      dndEnd: '08:00',
      showPreview: true,
      soundEnabled: true,
      priorityOnly: false
    };
  });

  // FIX: Use a ref to give socket handlers always-current access to settings and
  // notifications without them needing to be in the useEffect dependency array.
  // This prevents listener re-registration on every state change.
  const settingsRef = useRef(settings);
  const notificationsRef = useRef(notifications);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);

  // Supported apps list
  const supportedApps = [
    { id: 'whatsapp',   name: 'WhatsApp',   icon: '💬', color: '#25D366' },
    { id: 'telegram',   name: 'Telegram',   icon: '✈️', color: '#26A5E4' },
    { id: 'signal',     name: 'Signal',     icon: '🔒', color: '#3A76F0' },
    { id: 'discord',    name: 'Discord',    icon: '🎮', color: '#5865F2' },
    { id: 'slack',      name: 'Slack',      icon: '💼', color: '#4A154B' },
    { id: 'messenger',  name: 'Messenger',  icon: '💬', color: '#0084FF' },
    { id: 'instagram',  name: 'Instagram',  icon: '📸', color: '#E4405F' },
    { id: 'twitter',    name: 'Twitter',    icon: '🐦', color: '#1DA1F2' }
  ];

  // ─── Helpers (defined before useEffect so they are available inside it) ────

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Sound not supported');
    }
  };

  const getAppName = (appId) => {
    const app = supportedApps.find(a => a.id === appId);
    return app ? app.name : appId.charAt(0).toUpperCase() + appId.slice(1);
  };

  const getAppIcon = (appId) => {
    const app = supportedApps.find(a => a.id === appId);
    return app ? app.icon : '🔔';
  };

  const getAppColor = (appId) => {
    const app = supportedApps.find(a => a.id === appId);
    return app ? app.color : '#6B7280';
  };

  // ─── Socket event handlers & effect ──────────────────────────────────────

  useEffect(() => {
    // FIX: guard on socket and roomId only — settings/notifications are read
    // via refs so they never need to be dependencies here.
    if (!socket || !roomId) return;

    socketService.getNotificationSettings(roomId);
    socketService.getNotifications(roomId, { limit: 50 });

    const handleNotification = (notification) => {
      // FIX: read current settings from the ref, not a stale closure value
      const currentSettings = settingsRef.current;

      if (currentSettings.doNotDisturb) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const dndStart = parseTimeToMinutes(currentSettings.dndStart);
        const dndEnd   = parseTimeToMinutes(currentSettings.dndEnd);
        if (currentTime >= dndStart && currentTime < dndEnd) return;
      }

      if (
        currentSettings.apps.length > 0 &&
        !currentSettings.apps.includes(notification.app)
      ) {
        return;
      }

      setNotifications(prev => [notification, ...prev].slice(0, 100));
      setUnreadCount(prev => prev + 1);

      if (currentSettings.soundEnabled && notification.priority === 'high') {
        playNotificationSound();
      }

      // FIX: JSX is not valid in a .js file — use toast() with a plain string.
      // If you need the rich UI card, either rename this file to .jsx or render
      // the card from a separate .jsx component and pass it in as a prop/context.
      if (currentSettings.showPreview) {
        toast(
          `${getAppName(notification.app)}: ${notification.title}${
            notification.message ? ` — ${notification.message}` : ''
          }`,
          { duration: 5000, icon: getAppIcon(notification.app) }
        );
      }
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

    const handleNotificationSent = ({ success }) => {
      if (success) toast.success('Notification sent successfully');
    };

    const handleNotificationError = ({ message }) => {
      toast.error(`Notification error: ${message}`);
    };

    const handleNotificationBlocked = ({ reason }) => {
      toast.error(`Notification blocked: ${reason}`);
    };

    const handleNotificationRead = ({ notificationId, read, readAt }) => {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read, readAt } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleNotificationsAllRead = ({ app }) => {
      if (app) {
        setNotifications(prev =>
          prev.map(n => n.app === app ? { ...n, read: true, readAt: Date.now() } : n)
        );
        // FIX: compute removedCount from the ref, not the stale closure snapshot
        const count = notificationsRef.current.filter(n => n.app === app && !n.read).length;
        setUnreadCount(prev => Math.max(0, prev - count));
        toast.success(`${app} notifications marked as read`);
      } else {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, readAt: Date.now() }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    };

    const handleNotificationsCleared = ({ app }) => {
      if (app) {
        setNotifications(prev => prev.filter(n => n.app !== app));
        // FIX: read from ref so removedCount is accurate, not frozen at mount
        const removedCount = notificationsRef.current.filter(
          n => n.app === app && !n.read
        ).length;
        setUnreadCount(prev => Math.max(0, prev - removedCount));
        toast.success(`${app} notifications cleared`);
      } else {
        setNotifications([]);
        setUnreadCount(0);
        toast.success('All notifications cleared');
      }
    };

    const handleDNDStatus = ({ enabled, startTime, endTime }) => {
      setSettings(prev => ({
        ...prev,
        doNotDisturb: enabled,
        dndStart: startTime,
        dndEnd: endTime
      }));
      toast.info(enabled ? 'Do Not Disturb mode enabled' : 'Do Not Disturb mode disabled');
    };

    // Register all listeners once
    socket.on('notification',               handleNotification);
    socket.on('notification-settings',      handleSettingsUpdate);
    socket.on('notifications-history',      handleNotificationsHistory);
    socket.on('notification-sent',          handleNotificationSent);
    socket.on('notification-error',         handleNotificationError);
    socket.on('notification-blocked',       handleNotificationBlocked);
    socket.on('notification-read-status',   handleNotificationRead);
    socket.on('notifications-all-read',     handleNotificationsAllRead);
    socket.on('notifications-cleared',      handleNotificationsCleared);
    socket.on('notification-dnd-status',    handleDNDStatus);

    return () => {
      socket.off('notification',              handleNotification);
      socket.off('notification-settings',     handleSettingsUpdate);
      socket.off('notifications-history',     handleNotificationsHistory);
      socket.off('notification-sent',         handleNotificationSent);
      socket.off('notification-error',        handleNotificationError);
      socket.off('notification-blocked',      handleNotificationBlocked);
      socket.off('notification-read-status',  handleNotificationRead);
      socket.off('notifications-all-read',    handleNotificationsAllRead);
      socket.off('notifications-cleared',     handleNotificationsCleared);
      socket.off('notification-dnd-status',   handleDNDStatus);
    };
  // FIX: only re-run when the socket connection itself changes — settings and
  // notifications are accessed via refs and must NOT be listed here.
  }, [socket, roomId]);

  // ─── Public API ───────────────────────────────────────────────────────────

  const updateSettings = useCallback(async (newSettings) => {
    if (!socket || !roomId) return;
    const updated = { ...settingsRef.current, ...newSettings };
    setSettings(updated);
    storageService.setItem('notificationSettings', updated);
    socketService.updateNotificationSettings(roomId, updated);
    toast.success('Notification settings updated');
  }, [socket, roomId]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!socket || !roomId) return;
    socketService.markNotificationRead(roomId, notificationId);
  }, [socket, roomId]);

  const markAllAsRead = useCallback(async (app = null) => {
    if (!socket || !roomId) return;
    socket.emit('notifications-mark-all-read', { roomId, app });
  }, [socket, roomId]);

  const clearNotifications = useCallback(async (app = null) => {
    if (!socket || !roomId) return;
    socketService.clearNotifications(roomId, app);
  }, [socket, roomId]);

  const getNotificationCount = useCallback((app = null) => {
    if (app) {
      return notifications.filter(n => n.app === app && !n.read).length;
    }
    return unreadCount;
  }, [notifications, unreadCount]);

  const filterByApp = useCallback((app) => {
    return notifications.filter(n => n.app === app);
  }, [notifications]);

  const toggleDND = useCallback(async (enabled, startTime, endTime) => {
    if (!socket || !roomId) return;
    socket.emit('notification-dnd-toggle', { roomId, enabled, startTime, endTime });
  }, [socket, roomId]);

  const sendTestNotification = useCallback(async (app = 'whatsapp') => {
    if (!socket || !roomId) return;
    socketService.sendNotification(roomId, {
      app,
      title: 'Test Notification',
      message: 'This is a test notification from SYNCLYNK',
      priority: 'high',
      timestamp: Date.now()
    });
    toast.info('Sending test notification...');
  }, [socket, roomId]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  const getRecentNotifications = useCallback((limit = 10) => {
    return notifications.slice(0, limit);
  }, [notifications]);

  const clearUnreadForApp = useCallback(async (app) => {
    const unreadInApp = notifications.filter(n => n.app === app && !n.read);
    for (const notification of unreadInApp) {
      await markAsRead(notification.id);
    }
    toast.success(`Cleared unread ${app} notifications`);
  }, [notifications, markAsRead]);

  return {
    notifications,
    settings,
    unreadCount,
    isLoading,
    supportedApps,
    updateSettings,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getNotificationCount,
    filterByApp,
    toggleDND,
    sendTestNotification,
    getUnreadNotifications,
    getRecentNotifications,
    clearUnreadForApp,
    getAppName,
    getAppIcon,
    getAppColor
  };
};