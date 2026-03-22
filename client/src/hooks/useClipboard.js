import { useState, useCallback, useEffect, useRef } from 'react';
import clipboardService from '../services/clipboardService';
import { useSocket } from './useSocket';
import toast from 'react-hot-toast';

export const useClipboard = () => {
  const { roomId, isConnected } = useSocket();
  const [clipboard, setClipboard] = useState(null);
  const [clipboardHistory, setClipboardHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const lastSyncedRef = useRef('');
  const intervalRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Check clipboard permission
  const checkPermission = useCallback(async () => {
    try {
      await navigator.clipboard.readText();
      setPermissionGranted(true);
      return true;
    } catch (error) {
      setPermissionGranted(false);
      return false;
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    try {
      await navigator.clipboard.readText();
      setPermissionGranted(true);
      toast.success('Clipboard permission granted');
      return true;
    } catch (error) {
      toast.error('Please allow clipboard permission for auto-sync');
      return false;
    }
  }, []);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start clipboard monitoring
  const startMonitoring = useCallback(() => {
    // Basic requirements for syncing
    if (!roomId || !isConnected) return;

    // Avoid multiple intervals
    if (intervalRef.current) return;

    let lastContent = '';
    
    intervalRef.current = setInterval(async () => {
      try {
        const clipboardText = await navigator.clipboard.readText();
        
        if (clipboardText && clipboardText !== lastContent && clipboardText !== lastSyncedRef.current) {
          lastContent = clipboardText;
          lastSyncedRef.current = clipboardText;
          await clipboardService.updateClipboard(roomId, 'text', clipboardText);
          toast.success('Auto-synced to mobile', { icon: '🔄', duration: 1500 });
        }
      } catch (error) {
        // Permission might have been revoked or not yet granted
        if (error.name === 'NotAllowedError') {
          setPermissionGranted(false);
          stopMonitoring();
        }
      }
    }, 2000);
  }, [roomId, isConnected, stopMonitoring]);

  // Auto-sync when text changes in textarea (for manual input)
  const autoSyncText = useCallback((text) => {
    if (!roomId || !isConnected) return;
    if (!text || text === lastSyncedRef.current) return;
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (text !== lastSyncedRef.current) {
        clipboardService.updateClipboard(roomId, 'text', text);
        lastSyncedRef.current = text;
        toast.success('Auto-synced to mobile', { icon: '🔄', duration: 1500 });
      }
    }, 500);
  }, [roomId, isConnected]);

  // Initialize service and listeners
  useEffect(() => {
    clipboardService.loadCachedHistory();
    setClipboard(clipboardService.getCurrentClipboard());
    setClipboardHistory(clipboardService.getHistoryList());

    const handleSync = (data) => {
      setClipboard(data);
      if (data.type === 'text') {
        lastSyncedRef.current = data.fullContent || data.content;
      }
      toast.success(`${data.type === 'text' ? 'Text' : 'Image'} synced from mobile`);
    };

    const handleHistory = (history) => {
      setClipboardHistory(history);
      setIsLoading(false);
    };

    const handleError = ({ message }) => {
      toast.error(`Clipboard error: ${message}`);
      setIsLoading(false);
    };

    const handleCleared = () => {
      setClipboard(null);
      toast.info('Clipboard cleared');
    };

    clipboardService.on('sync', handleSync);
    clipboardService.on('history', handleHistory);
    clipboardService.on('error', handleError);
    clipboardService.on('cleared', handleCleared);

    return () => {
      clipboardService.off('sync', handleSync);
      clipboardService.off('history', handleHistory);
      clipboardService.off('error', handleError);
      clipboardService.off('cleared', handleCleared);
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Automatically start monitoring when connected and permissions are available
  useEffect(() => {
    const initSync = async () => {
      if (roomId && isConnected) {
        const hasPermission = await checkPermission();
        if (hasPermission) {
          startMonitoring();
        }
      } else {
        stopMonitoring();
      }
    };

    initSync();
    
    return () => stopMonitoring();
  }, [roomId, isConnected, checkPermission, startMonitoring, stopMonitoring]);

  // Update clipboard
  const updateClipboard = useCallback(async (type, content) => {
    if (!roomId) {
      toast.error('Not connected to any device');
      return false;
    }

    try {
      await clipboardService.updateClipboard(roomId, type, content);
      if (type === 'text') {
        lastSyncedRef.current = content;
      }
      return true;
    } catch (error) {
      console.error('Update clipboard error:', error);
      toast.error('Failed to update clipboard');
      return false;
    }
  }, [roomId]);

  // Request clipboard from mobile
  const requestClipboard = useCallback(async () => {
    if (!roomId) {
      toast.error('Not connected to any device');
      return;
    }

    setIsLoading(true);
    await clipboardService.requestClipboard(roomId);
    setTimeout(() => setIsLoading(false), 3000);
  }, [roomId]);

  // Get clipboard history
  const getClipboardHistory = useCallback(async (limit = 20) => {
    if (!roomId) return;
    setIsLoading(true);
    await clipboardService.getHistory(roomId, limit);
  }, [roomId]);

  // Clear clipboard
  const clearClipboard = useCallback(async () => {
    if (!roomId) return;
    await clipboardService.clearClipboard(roomId);
  }, [roomId]);

  // Copy to system clipboard
  const copyToSystemClipboard = useCallback(async (text) => {
    const success = await clipboardService.copyToSystemClipboard(text);
    if (success) {
      toast.success('Copied to system clipboard');
    } else {
      toast.error('Failed to copy to clipboard');
    }
    return success;
  }, []);

  return {
    clipboard,
    clipboardHistory,
    isLoading,
    permissionGranted,
    updateClipboard,
    requestClipboard,
    getClipboardHistory,
    clearClipboard,
    copyToSystemClipboard,
    autoSyncText,
    checkPermission,
    requestPermission
  };
};