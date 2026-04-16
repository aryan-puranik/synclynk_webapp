import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from './useSocket';
import toast from 'react-hot-toast';

// First 128 chars of raw base64 — fast fingerprint for image dedup
const imgHash = (dataUrl) => {
  if (!dataUrl) return '';
  const raw = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return raw?.slice(0, 128) ?? '';
};

export const useClipboard = () => {
  const { roomId, isConnected, socket } = useSocket();
  const [clipboard, setClipboard] = useState(null);
  const [clipboardHistory, setClipboardHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const lastSyncedRef        = useRef('');   // last text WE SENT
  const lastReceivedRef      = useRef('');   // last text WE RECEIVED
  const lastSyncedImageRef   = useRef('');   // hash of last image WE SENT
  const lastReceivedImageRef = useRef('');   // hash of last image WE RECEIVED
  const intervalRef          = useRef(null);

  useEffect(() => {
    console.log('useClipboard state:', { roomId, isConnected, socketId: socket?.id });
  }, [roomId, isConnected, socket]);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleClipboardSync = (data) => {
      console.log('📬 Received clipboard sync:', data);

      if (data.type === 'text') {
        const incoming = data.fullContent || data.content;
        // Skip if we already have this exact text (avoids duplicate state updates)
        if (incoming === lastReceivedRef.current) return;
        lastReceivedRef.current = incoming;
        lastSyncedRef.current   = incoming;
        setClipboard(data);

      } else if (data.type === 'image') {
        const hash = imgHash(data.fullContent || data.content);
        // Skip if same image we already received or sent
        if (hash && (hash === lastReceivedImageRef.current || hash === lastSyncedImageRef.current)) return;
        lastReceivedImageRef.current = hash;
        lastSyncedImageRef.current   = hash;
        setClipboard(data);
      } else {
        setClipboard(data);
      }
    };

    const handleHistoryResponse = (history) => {
      console.log('📜 Received history:', history);
      // Deduplicate by ID, then by content fingerprint for images
      const seenIds    = new Set();
      const seenHashes = new Set();
      const unique = history.filter(item => {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        if (item.type === 'image') {
          const h = imgHash(item.fullContent || item.content);
          if (seenHashes.has(h)) return false;
          seenHashes.add(h);
        }
        return true;
      });
      setClipboardHistory(unique);
      setIsLoading(false);
    };

    const handleClipboardUpdated = ({ success, data }) => {
      if (!success || !data) return;
      // console.log('📬 Received clipboard update:', data);

      if (data.type === 'text') {
        const incoming = data.fullContent || data.content;
        if (incoming === lastReceivedRef.current) return;
        lastReceivedRef.current = incoming;
        lastSyncedRef.current   = incoming;
        setClipboard(data);

      } else if (data.type === 'image') {
        const hash = imgHash(data.fullContent || data.content);
        if (hash && (hash === lastReceivedImageRef.current || hash === lastSyncedImageRef.current)) return;
        lastReceivedImageRef.current = hash;
        lastSyncedImageRef.current   = hash;
        setClipboard(data);
      } else {
        setClipboard(data);
      }
    };

    socket.on('clipboard-sync',            handleClipboardSync);
    socket.on('clipboard-history-response', handleHistoryResponse);
    socket.on('clipboard-updated',          handleClipboardUpdated);

    return () => {
      socket.off('clipboard-sync',            handleClipboardSync);
      socket.off('clipboard-history-response', handleHistoryResponse);
      socket.off('clipboard-updated',          handleClipboardUpdated);
    };
  }, [socket]);

  // ── Permission helpers ─────────────────────────────────────────────────────
  const checkPermission = useCallback(async () => {
    try {
      await navigator.clipboard.read();
      setPermissionGranted(true);
      return true;
    } catch {
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

  const requestPermission = useCallback(async () => {
    try {
      await navigator.clipboard.read();
      setPermissionGranted(true);
      toast.success('Clipboard permission granted');
      return true;
    } catch {
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

  const readFromSystemClipboard = useCallback(async () => {
    try { return await navigator.clipboard.readText() || ''; }
    catch { return null; }
  }, []);

  const readImageFromSystemClipboard = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload  = (e) => resolve({ dataUrl: e.target.result, size: blob.size, mimeType: imageType });
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        }
      }
      return null;
    } catch { return null; }
  }, []);

  // ── Monitoring ────────────────────────────────────────────────────────────
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const startMonitoring = useCallback(() => {
    if (!roomId || !isConnected || !socket || intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      if (!document.hasFocus()) return;

      try {
        const clipboardItems = await navigator.clipboard.read();
        let handledImage = false;

        for (const item of clipboardItems) {
          const imageType = item.types.find(t => t.startsWith('image/'));
          if (imageType) {
            handledImage = true;
            const blob   = await item.getType(imageType);
            const dataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload  = (e) => resolve(e.target.result);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            });

            if (!dataUrl) break;
            const hash = imgHash(dataUrl);

            // Skip if already sent OR already received from other side
            if (hash === lastSyncedImageRef.current || hash === lastReceivedImageRef.current) break;

            console.log('🖼️ Auto-syncing new clipboard image');
            lastSyncedImageRef.current = hash;

            socket.emit('clipboard-update', { roomId, type: 'image', content: dataUrl, size: blob.size, mimeType: imageType });
            setClipboard({ type: 'image', content: dataUrl, fullContent: dataUrl, size: blob.size, timestamp: Date.now() });
            break;
          }

          if (!handledImage && item.types.includes('text/plain')) {
            const blob = await item.getType('text/plain');
            const text = await blob.text();

            if (!text || text === lastSyncedRef.current || text === lastReceivedRef.current) continue;

            console.log('✨ Auto-syncing new local content');
            lastSyncedRef.current = text;

            socket.emit('clipboard-update', { roomId, type: 'text', content: text });
            setClipboard({ type: 'text', content: text, fullContent: text, timestamp: Date.now() });
          }
        }
      } catch (error) {
        if (error.name !== 'NotAllowedError') {
          try {
            const text = await navigator.clipboard.readText();
            if (!text || text === lastSyncedRef.current || text === lastReceivedRef.current) return;
            lastSyncedRef.current = text;
            socket.emit('clipboard-update', { roomId, type: 'text', content: text });
            setClipboard({ type: 'text', content: text, fullContent: text, timestamp: Date.now() });
          } catch { /* ignore focus errors */ }
        }
      }
    }, 2000);
  }, [roomId, isConnected, socket]);

  useEffect(() => {
    const init = async () => {
      if (roomId && isConnected && socket) {
        if (await checkPermission()) startMonitoring();
      } else {
        stopMonitoring();
      }
    };
    init();
    return () => stopMonitoring();
  }, [roomId, isConnected, socket, checkPermission, startMonitoring, stopMonitoring]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const updateClipboard = useCallback(async (type, content, meta = {}) => {
    if (!roomId || !socket) { toast.error('Not connected to any device'); return false; }
    try {
      socket.emit('clipboard-update', { roomId, type, content, ...meta });
      if (type === 'text') {
        lastSyncedRef.current = content;
        setClipboard({ type, content, fullContent: content, timestamp: Date.now() });
      }
      if (type === 'image') {
        lastSyncedImageRef.current = imgHash(content);
        setClipboard({ type, content, fullContent: content, timestamp: Date.now(), ...meta });
      }
      return true;
    } catch (error) {
      toast.error('Failed to update clipboard');
      return false;
    }
  }, [roomId, socket]);

  const requestClipboard = useCallback(async () => {
    if (!roomId || !socket) { toast.error('Not connected to any device'); return; }
    setIsLoading(true);
    socket.emit('clipboard-request', { roomId });
    setTimeout(() => setIsLoading(false), 3000);
  }, [roomId, socket]);

  const getClipboardHistory = useCallback(async (limit = 20) => {
    if (!roomId || !socket) return;
    setIsLoading(true);
    socket.emit('clipboard-history', { roomId, limit });
    setTimeout(() => setIsLoading(false), 3000);
  }, [roomId, socket]);

  const clearClipboard = useCallback(async () => {
    if (!roomId || !socket) return;
    socket.emit('clipboard-clear', { roomId });
  }, [roomId, socket]);

  const copyToSystemClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to system clipboard');
      return true;
    } catch {
      toast.error('Failed to copy to clipboard');
      return false;
    }
  }, []);

  return {
    clipboard, clipboardHistory, isLoading, permissionGranted,
    updateClipboard, requestClipboard, getClipboardHistory,
    clearClipboard, copyToSystemClipboard, checkPermission,
    requestPermission, readFromSystemClipboard, readImageFromSystemClipboard,
  };
};