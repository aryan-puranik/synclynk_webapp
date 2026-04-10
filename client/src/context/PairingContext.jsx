import React, { createContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

export const PairingContext = createContext(null);

export const PairingProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [deviceId, setDeviceId] = useState(localStorage.getItem('deviceId'));
  const [roomId, setRoomId] = useState(localStorage.getItem('roomId'));

  // REVERTED: Initialize paired to false to require a fresh scan/handshake
  const [paired, setPaired] = useState(false);

  const [clipboard, setClipboard] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);

      // REVERTED: Register only when connection is established
      if (deviceId) {
        newSocket.emit('register-device', {
          deviceId,
          deviceType: 'browser'
        });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle pairing events
    const handlePaired = ({ roomId: newRoomId }) => {
      setRoomId(newRoomId);
      setPaired(true);
      localStorage.setItem('roomId', newRoomId);
      toast.success('Devices paired successfully!');
    };

    newSocket.on('paired', handlePaired);
    newSocket.on('paired-success', handlePaired);

    newSocket.on('pairing-error', ({ message }) => {
      toast.error(message);
    });

    newSocket.on('clipboard-sync', (data) => {
      setClipboard(data);
      toast.success(`${data.type === 'text' ? 'Text' : 'Image'} synced!`);
    });

    newSocket.on('stream-started', () => {
      setIsStreaming(true);
      toast.success('Mobile device started streaming');
    });

    newSocket.on('stream-stopped', () => {
      setIsStreaming(false);
      setViewerCount(0);
      toast('Stream ended');
    });

    newSocket.on('peer-disconnected', () => {
      toast.error('Mobile device disconnected');
      setPaired(false);
      setRoomId(null);
      localStorage.removeItem('roomId');
    });

    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, [deviceId]);

  const registerDevice = (newDeviceId) => {
    setDeviceId(newDeviceId);
    localStorage.setItem('deviceId', newDeviceId);
    socket?.emit('register-device', {
      deviceId: newDeviceId,
      deviceType: 'browser'
    });
  };

  const pairWithCode = (pairingCode) => {
    if (!deviceId) {
      toast.error('Please generate a pairing code first');
      return;
    }
    socket?.emit('pair-with-code', { pairingCode, deviceId });
  };


  const disconnect = useCallback(() => {
    // 1. Notify server to kill the session in its Maps
    if (socket) {
      socket.emit('manual-disconnect', { deviceId, roomId });
      socket.disconnect(); // Explicitly close the socket
    }

    // 2. Reset React State
    setPaired(false);
    setRoomId(null);
    setDeviceId(null); // Clear local state

    // 3. Clear Storage - This prevents the "Auto-Rejoin" on refresh
    localStorage.removeItem('roomId');
    localStorage.removeItem('deviceId');

    toast.success('Disconnected successfully');
  }, [socket, deviceId, roomId]);

  const updateClipboard = (type, content) => {
    if (roomId && socket) {
      socket.emit('clipboard-update', { roomId, type, content });
      setClipboard({ type, content, timestamp: Date.now() });
    }
  };

  const requestClipboard = () => {
    if (roomId && socket) socket.emit('clipboard-request', { roomId });
  };

  const startStream = () => {
    if (roomId && socket) {
      socket.emit('start-stream', { roomId });
      setIsStreaming(true);
    }
  };

  const stopStream = () => {
    if (roomId && socket) {
      socket.emit('stop-stream', { roomId });
      setIsStreaming(false);
    }
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
    registerDevice,
    pairWithCode,
    disconnect,
    updateClipboard,
    requestClipboard,
    startStream,
    stopStream
  };

  return <PairingContext.Provider value={value}>{children}</PairingContext.Provider>;
};