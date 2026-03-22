import { useEffect, useRef } from 'react';
import { useNotifications } from './useNotifications';
import { showNotificationToast } from '../components/notifications/NotificationToast';

export const useToastNotifications = () => {
  const { notifications } = useNotifications();
  const lastProcessedRef = useRef(null);

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    
    const latestNotification = notifications[0];
    const lastProcessed = lastProcessedRef.current;
    
    // Check if this is a new notification
    if (!lastProcessed || latestNotification.id !== lastProcessed.id) {
      lastProcessedRef.current = latestNotification;
      
      // Show toast for high priority notifications
      if (latestNotification.priority === 'high' && !latestNotification.read) {
        showNotificationToast(latestNotification);
      }
    }
  }, [notifications]);

  return null;
};