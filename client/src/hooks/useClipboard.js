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
  // Track last synced image as a hash/size string to avoid re-sending same image
  const lastSyncedImageRef = useRef('');
  const lastReceivedImageRef = useRef('');

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

      if (data.type === 'image') {
        const incoming = data.fullContent || data.content;
        lastReceivedImageRef.current = incoming;
        lastSyncedImageRef.current = incoming;
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

        if (data.type === 'image') {
          const incoming = data.fullContent || data.content;
          lastReceivedImageRef.current = incoming;
          lastSyncedImageRef.current = incoming;
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

  // Check clipboard permission (text + image)
  const checkPermission = useCallback(async () => {
    try {
      // Try reading clipboard items (covers both text and image)
      await navigator.clipboard.read();
      setPermissionGranted(true);
      return true;
    } catch (error) {
      // Fallback: try text-only read
      try {
        await navigator.clipboard.readText();
        setPermissionGranted(true);
        return true;
      } catch {
        setPermissionGranted(false);
        return false;
      }
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    try {
      await navigator.clipboard.read();
      setPermissionGranted(true);
      toast.success('Clipboard permission granted');
      return true;
    } catch (error) {
      try {
        await navigator.clipboard.readText();
        setPermissionGranted(true);
        toast.success('Clipboard permission granted');
        return true;
      } catch {
        toast.error('Please allow clipboard permission for auto-sync');
        return false;
      }
    }
  }, []);

  // Read from system clipboard (text)
  const readFromSystemClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      return text || '';
    } catch (error) {
      console.error('Failed to read from system clipboard:', error);
      return null;
    }
  }, []);

  // Read image from system clipboard, returns base64 data URL or null
  const readImageFromSystemClipboard = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ dataUrl: e.target.result, size: blob.size, mimeType: imageType });
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        }
      }
      return null;
    } catch {
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

  // Start clipboard monitoring (text + image)
  const startMonitoring = useCallback(() => {
    if (!roomId || !isConnected || !socket || intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      // Only attempt read if the window is active to prevent NotAllowedError
      if (!document.hasFocus()) return;

      try {
        const clipboardItems = await navigator.clipboard.read();
        let handledImage = false;

        for (const item of clipboardItems) {
          // --- Image detection ---
          const imageType = item.types.find(t => t.startsWith('image/'));
          if (imageType) {
            handledImage = true;
            const blob = await item.getType(imageType);
            const dataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            });

            if (
              dataUrl &&
              dataUrl !== lastSyncedImageRef.current &&
              dataUrl !== lastReceivedImageRef.current
            ) {
              console.log('🖼️ Auto-syncing new clipboard image');
              lastSyncedImageRef.current = dataUrl;

              socket.emit('clipboard-update', {
                roomId,
                type: 'image',
                content: dataUrl,
                size: blob.size,
                mimeType: imageType,
              });

              setClipboard({
                type: 'image',
                content: dataUrl,
                fullContent: dataUrl,
                size: blob.size,
                timestamp: Date.now(),
              });
            }
            break; // Only process first image
          }

          // --- Text detection (only if no image found) ---
          if (!handledImage && item.types.includes('text/plain')) {
            const blob = await item.getType('text/plain');
            const clipboardText = await blob.text();

            if (
              clipboardText &&
              clipboardText !== lastSyncedRef.current &&
              clipboardText !== lastReceivedRef.current
            ) {
              console.log('✨ Auto-syncing new local content');
              lastSyncedRef.current = clipboardText;

              socket.emit('clipboard-update', {
                roomId,
                type: 'text',
                content: clipboardText,
              });

              setClipboard({
                type: 'text',
                content: clipboardText,
                fullContent: clipboardText,
                timestamp: Date.now(),
              });
            }
          }
        }
      } catch (error) {
        // Fallback to text-only read if clipboard.read() is unavailable
        if (error.name !== 'NotAllowedError') {
          try {
            const clipboardText = await navigator.clipboard.readText();
            if (
              clipboardText &&
              clipboardText !== lastSyncedRef.current &&
              clipboardText !== lastReceivedRef.current
            ) {
              console.log('✨ Auto-syncing new local content (text fallback)');
              lastSyncedRef.current = clipboardText;

              socket.emit('clipboard-update', {
                roomId,
                type: 'text',
                content: clipboardText,
              });

              setClipboard({
                type: 'text',
                content: clipboardText,
                fullContent: clipboardText,
                timestamp: Date.now(),
              });
            }
          } catch {
            // Silently ignore focus-related errors
          }
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
  const updateClipboard = useCallback(async (type, content, meta = {}) => {
    if (!roomId || !socket) {
      toast.error('Not connected to any device');
      return false;
    }

    try {
      console.log('📤 Sending clipboard update:', { type, contentLength: content?.length });
      socket.emit('clipboard-update', { roomId, type, content, ...meta });

      if (type === 'text') {
        lastSyncedRef.current = content;
        setClipboard({ type, content, fullContent: content, timestamp: Date.now() });
      }

      if (type === 'image') {
        lastSyncedImageRef.current = content;
        setClipboard({ type, content, fullContent: content, timestamp: Date.now(), ...meta });
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
    setTimeout(() => setIsLoading(false), 3000);
  }, [roomId, socket]);

  // Clear clipboard
  const clearClipboard = useCallback(async () => {
    if (!roomId || !socket) return;
    socket.emit('clipboard-clear', { roomId });
  }, [roomId, socket]);

  // Copy text to system clipboard
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
    readFromSystemClipboard,
    readImageFromSystemClipboard,
  };
};