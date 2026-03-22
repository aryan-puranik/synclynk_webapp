import notificationService from '../services/notificationService.js';
import store from '../utils/inMemoryStore.js';

export default function(socket, io, getRoomId) {
  
  // Send notification from mobile to browser
  socket.on('notification', async ({ roomId, notification }) => {
    const currentRoomId = roomId || getRoomId();
    if (!currentRoomId) {
      socket.emit('notification-error', { message: 'No active room' });
      return;
    }
    
    try {
      const result = await notificationService.sendNotification(
        currentRoomId,
        notification,
        socket.deviceId
      );
      
      if (result.delivered) {
        // Broadcast to all devices in the room except sender
        socket.to(currentRoomId).emit('notification', result.notification);
        
        // Also send confirmation back to sender
        socket.emit('notification-sent', {
          success: true,
          notification: result.notification
        });
        
        console.log(`[NOTIFICATION] Delivered: ${notification.app} - ${notification.title}`);
      } else {
        socket.emit('notification-blocked', {
          reason: result.reason,
          notification
        });
        console.log(`[NOTIFICATION] Blocked: ${notification.app} - ${result.reason}`);
      }
    } catch (error) {
      console.error('[NOTIFICATION] Error:', error);
      socket.emit('notification-error', { message: error.message });
    }
  });
  
  // Update notification settings
  socket.on('notification-settings-update', async (settings) => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    try {
      const updatedSettings = await notificationService.updateSettings(
        roomId,
        settings,
        socket.deviceId
      );
      
      // Broadcast updated settings to all devices in room
      io.to(roomId).emit('notification-settings', updatedSettings);
      
      socket.emit('notification-settings-updated', {
        success: true,
        settings: updatedSettings
      });
      
      console.log(`[NOTIFICATION] Settings updated for room ${roomId}`);
    } catch (error) {
      console.error('[NOTIFICATION] Settings update error:', error);
      socket.emit('notification-settings-error', { message: error.message });
    }
  });
  
  // Get notification settings
  socket.on('get-notification-settings', async () => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    const settings = await notificationService.getSettings(roomId);
    socket.emit('notification-settings', settings);
  });
  
  // Get notification history
  socket.on('get-notifications', async ({ filters = {} } = {}) => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    const notifications = await notificationService.getNotifications(roomId, filters);
    socket.emit('notifications-history', notifications);
  });
  
  // Mark notification as read
  socket.on('notification-read', async ({ notificationId }) => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    const notification = await notificationService.markAsRead(roomId, notificationId);
    if (notification) {
      // Notify all devices about read status
      io.to(roomId).emit('notification-read-status', {
        notificationId,
        read: true,
        readAt: notification.readAt
      });
    }
  });
  
  // Mark all notifications as read for specific app
  socket.on('notifications-mark-all-read', async ({ app = null } = {}) => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    const notifications = await notificationService.getNotifications(roomId, { app });
    for (const notification of notifications) {
      if (!notification.read) {
        await notificationService.markAsRead(roomId, notification.id);
      }
    }
    
    io.to(roomId).emit('notifications-all-read', { app });
    console.log(`[NOTIFICATION] Marked all ${app || 'notifications'} as read`);
  });
  
  // Clear notifications
  socket.on('notifications-clear', async ({ app = null } = {}) => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    const result = await notificationService.clearNotifications(roomId, app);
    if (result.cleared) {
      io.to(roomId).emit('notifications-cleared', { app });
      console.log(`[NOTIFICATION] Cleared ${app || 'all notifications'}`);
    }
  });
  
  // Get supported apps
  socket.on('get-supported-apps', () => {
    const supportedApps = notificationService.getSupportedApps();
    socket.emit('supported-apps', supportedApps);
  });
  
  // DND (Do Not Disturb) mode toggle
  socket.on('notification-dnd-toggle', async ({ enabled, startTime, endTime }) => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    const settings = await notificationService.updateSettings(roomId, {
      doNotDisturb: enabled,
      dndStart: startTime,
      dndEnd: endTime
    }, socket.deviceId);
    
    io.to(roomId).emit('notification-dnd-status', {
      enabled: settings.doNotDisturb,
      startTime: settings.dndStart,
      endTime: settings.dndEnd
    });
    
    console.log(`[NOTIFICATION] DND mode ${enabled ? 'enabled' : 'disabled'}`);
  });
  
  // Test notification (for debugging)
  socket.on('test-notification', async ({ app = 'whatsapp', title = 'Test Notification', message = 'This is a test notification' }) => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    const testNotification = {
      app,
      title,
      message,
      priority: 'high',
      timestamp: Date.now()
    };
    
    const result = await notificationService.sendNotification(
      roomId,
      testNotification,
      socket.deviceId
    );
    
    if (result.delivered) {
      io.to(roomId).emit('notification', result.notification);
      socket.emit('test-notification-sent', { success: true });
    } else {
      socket.emit('test-notification-failed', { reason: result.reason });
    }
  });
}