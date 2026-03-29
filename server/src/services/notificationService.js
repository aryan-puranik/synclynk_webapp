import store from '../utils/inMemoryStore.js';

class NotificationService {
  constructor() {
    this.supportedApps = [
      'com.whatsapp', 'com.whatsapp.w4b', 'com.instagram.android', 
      'com.facebook.katana', 'com.facebook.orca', 'org.telegram.messenger',
      'com.google.android.gm', 'com.discord', 'com.slack'
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
            // Store for later delivery
            this.storeDelayedNotification(roomId, notification);
            return { delivered: false, reason: 'do_not_disturb', delayed: true };
          }
        }
      }

      // Check if app is allowed
      if (settings && settings.apps && settings.apps.length > 0) {
        if (!settings.apps.includes(notification.app.toLowerCase())) {
          return { delivered: false, reason: 'app_not_allowed' };
        }
      }

      // 5. Build the Final Payload
      const notificationData = {
        // Use ID from app if provided, otherwise generate
        id: notification.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        app: notification.app,           // e.g., "com.whatsapp"
        appName: notification.appName,   // e.g., "WhatsApp"
        title: notification.title,
        body: notification.body,         // Use 'body' to match the mobile app's field
        timestamp: notification.timestamp || Date.now(),
        senderId,
        read: false,
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

  validateNotification(notification) {
    if (!notification.app) {
      return { valid: false, error: 'Package name (app) is required' };
    }
    
    // Check 'body' instead of 'message' to match the app's MirroredNotification
    if (!notification.title && !notification.body) {
      return { valid: false, error: 'Notification must have a title or body' };
    }
    
    return { valid: true };
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
      return { valid: false, error: 'App name is required' };
    }
    
    if (!this.supportedApps.includes(notification.app.toLowerCase())) {
      return { valid: false, error: `Unsupported app: ${notification.app}` };
    }
    
    if (!notification.title || notification.title.length > 100) {
      return { valid: false, error: 'Title must be between 1-100 characters' };
    }
    
    if (notification.message && notification.message.length > 500) {
      return { valid: false, error: 'Message must be less than 500 characters' };
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
      apps: this.supportedApps,
      doNotDisturb: false,
      dndStart: null,
      dndEnd: null,
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