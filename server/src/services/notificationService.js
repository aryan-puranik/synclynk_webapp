import store from '../utils/inMemoryStore.js';

class NotificationService {
  constructor() {
    // UPDATED: Use full package names to match Android app emission
    this.supportedApps = [
      'com.whatsapp', 
      'com.whatsapp.w4b', 
      'org.telegram.messenger', 
      'com.discord', 
      'com.slack', 
      'com.facebook.orca', 
      'com.instagram.android', 
      'com.google.android.gm',
      'com.google.android.apps.messaging'
    ];
    this.maxNotifications = 100;
  }

  async sendNotification(roomId, notification, senderId) {
    try {
      const validated = this.validateNotification(notification);
      if (!validated.valid) {
        throw new Error(validated.error);
      }

      const settings = store.getNotificationSettings(roomId);
      
      // Check if notifications are enabled globally
      if (settings && settings.enabled === false) {
        return { delivered: false, reason: 'notifications_disabled' };
      }
      
      // Check DND mode
      if (settings && settings.doNotDisturb) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        if (settings.dndStart && settings.dndEnd) {
          const dndStart = this.timeToMinutes(settings.dndStart);
          const dndEnd = this.timeToMinutes(settings.dndEnd);
          
          if (currentTime >= dndStart && currentTime < dndEnd) {
            this.storeDelayedNotification(roomId, notification);
            return { delivered: false, reason: 'do_not_disturb', delayed: true };
          }
        }
      }

      // Check if app is allowed (using package name)
      if (settings && settings.apps && settings.apps.length > 0) {
        // notification.app is 'com.google.android.gm'
        if (!settings.apps.includes(notification.app.toLowerCase())) {
          return { delivered: false, reason: 'app_not_allowed' };
        }
      }

      const notificationData = {
        // Generate unique ID if not provided by native app
        id: notification.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        app: notification.app,
        appName: notification.appName,
        title: notification.title,
        body: notification.body, // Use 'body' to match native payload
        senderId,
        timestamp: notification.timestamp || Date.now(),
        read: false,
        priority: notification.priority || 'normal',
        deliveredAt: Date.now()
      };

      // Store notification history
      const history = store.getNotificationHistory(roomId) || [];
      history.unshift(notificationData);
      store.setNotificationHistory(roomId, history.slice(0, this.maxNotifications));

      return {
        delivered: true,
        notification: notificationData
      };
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  }

  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  storeDelayedNotification(roomId, notification) {
    const delayed = store.getDelayedNotifications(roomId) || [];
    delayed.push({
      ...notification,
      timestamp: Date.now()
    });
    store.setDelayedNotifications(roomId, delayed.slice(0, 50));
  }

  validateNotification(notification) {
    if (!notification.app) {
      return { valid: false, error: 'App package name is required' };
    }
    
    // Check against package name whitelist
    if (!this.supportedApps.includes(notification.app.toLowerCase())) {
      return { valid: false, error: `Unsupported app package: ${notification.app}` };
    }
    
    // Check for title or body (Gmail often has one or both)
    if (!notification.title && !notification.body) {
      return { valid: false, error: 'Notification must have a title or body' };
    }
    
    return { valid: true };
  }

  async updateSettings(roomId, settings, deviceId) {
    const currentSettings = store.getNotificationSettings(roomId) || {};
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      updatedAt: Date.now(),
      updatedBy: deviceId
    };
    
    store.setNotificationSettings(roomId, updatedSettings);
    return updatedSettings;
  }

  async getSettings(roomId) {
    const settings = store.getNotificationSettings(roomId);
    return settings || {
      enabled: true,
      apps: this.supportedApps, // Default to all supported package names
      doNotDisturb: false,
      dndStart: '22:00',
      dndEnd: '08:00',
      showPreview: true,
      soundEnabled: true
    };
  }

  async getNotifications(roomId, filters = {}) {
    let history = store.getNotificationHistory(roomId) || [];
    
    if (filters.app) {
      history = history.filter(n => n.app === filters.app);
    }
    
    if (filters.unreadOnly) {
      history = history.filter(n => !n.read);
    }
    
    if (filters.since) {
      history = history.filter(n => n.timestamp > filters.since);
    }
    
    if (filters.limit) {
      history = history.slice(0, filters.limit);
    }
    
    return history;
  }

  async markAsRead(roomId, notificationId) {
    const history = store.getNotificationHistory(roomId) || [];
    const notification = history.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      notification.readAt = Date.now();
      store.setNotificationHistory(roomId, history);
      return notification;
    }
    return null;
  }

  async clearNotifications(roomId, app = null) {
    let history = store.getNotificationHistory(roomId) || [];
    if (app) {
      history = history.filter(n => n.app !== app);
    } else {
      history = [];
    }
    store.setNotificationHistory(roomId, history);
    return { cleared: true, remaining: history.length };
  }

  getSupportedApps() {
    return this.supportedApps;
  }

  async processDelayedNotifications(roomId) {
    const delayed = store.getDelayedNotifications(roomId) || [];
    const settings = store.getNotificationSettings(roomId);
    
    if (settings && !settings.doNotDisturb) {
      for (const notification of delayed) {
        await this.sendNotification(roomId, notification, 'system');
      }
      store.setDelayedNotifications(roomId, []);
      return delayed.length;
    }
    return 0;
  }
}

export default new NotificationService();