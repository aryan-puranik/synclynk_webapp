import React, { createContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

export const PairingContext = createContext(null);

export const PairingProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [deviceId, setDeviceId] = useState(localStorage.getItem('deviceId'));
  const [roomId, setRoomId] = useState(localStorage.getItem('roomId'));
  const [paired, setPaired] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // 1. Initialize socket once and keep it stable
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Web connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => setIsConnected(false));

    // Handle pairing events from server
    const handlePaired = ({ roomId: newRoomId }) => {
      console.log('[Socket] Pairing successful. Room:', newRoomId);
      setRoomId(newRoomId);
      setPaired(true);
      localStorage.setItem('roomId', newRoomId);
      toast.success('Connected to mobile device!');
    };

    newSocket.on('paired', handlePaired);
    newSocket.on('paired-success', handlePaired);

    newSocket.on('pairing-error', ({ message }) => toast.error(message));

    newSocket.on('clipboard-sync', (data) => {
      setClipboard(data);
      toast.success(`${data.type === 'text' ? 'Text' : 'Image'} synced!`);
    });

    newSocket.on('stream-started', (data) => {
      setIsStreaming(true);
      if (data?.viewerCount !== undefined) setViewerCount(data.viewerCount);
      toast.success('Mobile stream started');
    });

    newSocket.on('stream-stopped', () => {
      setIsStreaming(false);
      setViewerCount(0);
    });

    newSocket.on('peer-disconnected', () => {
      setPaired(false);
      toast.error('Mobile device disconnected');
    });

    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, []); // Empty dependency array ensures socket doesn't restart

  // 2. Handle device registration separately to avoid socket restarts
  useEffect(() => {
    if (socket && isConnected && deviceId) {
      console.log('[Socket] Registering device:', deviceId);
      socket.emit('register-device', { deviceId, deviceType: 'browser' });
    }
  }, [socket, isConnected, deviceId]);

  const registerDevice = useCallback((newDeviceId) => {
    setDeviceId(newDeviceId);
    localStorage.setItem('deviceId', newDeviceId);
  }, []);

  const pairWithCode = (pairingCode) => {
    if (!socket || !deviceId) return toast.error('Connection not ready');
    socket.emit('pair-with-code', { pairingCode, deviceId });
  };

  const updateClipboard = (type, content) => {
    if (roomId && socket) socket.emit('clipboard-update', { roomId, type, content });
  };

  const requestClipboard = () => {
    if (roomId && socket) socket.emit('clipboard-request', { roomId });
  };

  const value = {
    socket,
    isConnected,
    deviceId,
    roomId,
    paired,
    clipboard,
    isStreaming,
    viewerCount,
    notifications,
    registerDevice,
    pairWithCode,
    updateClipboard,
    requestClipboard,
  };

  return <PairingContext.Provider value={value}>{children}</PairingContext.Provider>;
};