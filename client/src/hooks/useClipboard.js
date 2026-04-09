import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from './useSocket';
import toast from 'react-hot-toast';

export const useClipboard = () => {
  const { roomId, isConnected, socket } = useSocket();
  const [clipboard, setClipboard] = useState(null);
  const [clipboardHistory, setClipboardHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const lastSyncedRef = useRef('');
  const intervalRef = useRef(null);
  const lastReceivedRef = useRef('');

  // Debug logging
  useEffect(() => {
    console.log('useClipboard state:', { roomId, isConnected, socketId: socket?.id });
  }, [roomId, isConnected, socket]);

  // Listen for clipboard updates and history from socket
  useEffect(() => {
    if (!socket) return;

    const handleClipboardSync = (data) => {
      console.log('📬 Received clipboard sync:', data);
      setClipboard(data);

      if (data.type === 'text') {
        const incoming = data.fullContent || data.content;
        lastReceivedRef.current = incoming;
        lastSyncedRef.current = incoming;
      }
    };

    const handleHistoryResponse = (history) => {
      console.log('📜 Received history:', history);
      setClipboardHistory(history);
      setIsLoading(false);
    };

    const handleClipboardUpdated = ({ success, data }) => {
      if (success && data) {
        console.log('📬 Received clipboard update:', data);
        setClipboard(data);

        if (data.type === 'text') {
          const incoming = data.fullContent || data.content;
          lastReceivedRef.current = incoming;
          lastSyncedRef.current = incoming;
        }
      }
    };

    // Register all socket listeners
    socket.on('clipboard-sync', handleClipboardSync);
    socket.on('clipboard-history-response', handleHistoryResponse);
    socket.on('clipboard-updated', handleClipboardUpdated);

    return () => {
      // Clean up all socket listeners
      socket.off('clipboard-sync', handleClipboardSync);
      socket.off('clipboard-history-response', handleHistoryResponse);
      socket.off('clipboard-updated', handleClipboardUpdated);
    };
  }, [socket]);

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

  // Read from system clipboard
  const readFromSystemClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      return text || '';
    } catch (error) {
      console.error('Failed to read from system clipboard:', error);
      return null;
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
  if (!roomId || !isConnected || !socket || intervalRef.current) return;

  intervalRef.current = setInterval(async () => {
    // Only attempt read if the window is active to prevent NotAllowedError
    if (!document.hasFocus()) return; 

    try {
      const clipboardText = await navigator.clipboard.readText();

      // Check if content is actually different from our tracking refs
      if (
        clipboardText && 
        clipboardText !== lastSyncedRef.current && 
        clipboardText !== lastReceivedRef.current
      ) {
        console.log('✨ Auto-syncing new local content');
        lastSyncedRef.current = clipboardText; // Update tracking immediately

        socket.emit('clipboard-update', {
          roomId,
          type: 'text',
          content: clipboardText
        });

        setClipboard({
          type: 'text',
          content: clipboardText,
          fullContent: clipboardText,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      // Ignore focus-related errors instead of killing the monitor
      if (error.name !== 'NotAllowedError') {
        console.error('Monitor read error:', error);
      }
    }
  }, 2000);
}, [roomId, isConnected, socket]);

  // Automatically start monitoring when connected and permissions are available
  useEffect(() => {
    const initSync = async () => {
      if (roomId && isConnected && socket) {
        const hasPermission = await checkPermission();
        if (hasPermission) {
          startMonitoring();
        } else {
          console.log('No clipboard permission, waiting for user to grant');
        }
      } else {
        stopMonitoring();
      }
    };

    initSync();

    return () => stopMonitoring();
  }, [roomId, isConnected, socket, checkPermission, startMonitoring, stopMonitoring]);

  // Update clipboard (send to other devices)
  const updateClipboard = useCallback(async (type, content) => {
    if (!roomId || !socket) {
      toast.error('Not connected to any device');
      return false;
    }

    try {
      console.log('📤 Sending clipboard update:', { type, content: content.substring(0, 50) });
      socket.emit('clipboard-update', { roomId, type, content });

      if (type === 'text') {
        lastSyncedRef.current = content;
        setClipboard({ type, content, fullContent: content, timestamp: Date.now() });
      }
      return true;
    } catch (error) {
      console.error('Update clipboard error:', error);
      toast.error('Failed to update clipboard');
      return false;
    }
  }, [roomId, socket]);

  // Request clipboard from other device
  const requestClipboard = useCallback(async () => {
    if (!roomId || !socket) {
      toast.error('Not connected to any device');
      return;
    }

    setIsLoading(true);
    socket.emit('clipboard-request', { roomId });
    setTimeout(() => setIsLoading(false), 3000);
  }, [roomId, socket]);

  // Get clipboard history
  const getClipboardHistory = useCallback(async (limit = 20) => {
    if (!roomId || !socket) return;
    setIsLoading(true);
    socket.emit('clipboard-history', { roomId, limit });
    // History will come back via socket event
    setTimeout(() => setIsLoading(false), 3000);
  }, [roomId, socket]);

  // Clear clipboard
  const clearClipboard = useCallback(async () => {
    if (!roomId || !socket) return;
    socket.emit('clipboard-clear', { roomId });
  }, [roomId, socket]);

  // Copy to system clipboard
  const copyToSystemClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to system clipboard');
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
      return false;
    }
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
    checkPermission,
    requestPermission,
    readFromSystemClipboard
  };
};