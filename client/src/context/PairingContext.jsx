import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

// Create and export the context
export const PairingContext = createContext(null);

export const PairingProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [deviceId, setDeviceId] = useState(localStorage.getItem('deviceId'));
  const [roomId, setRoomId] = useState(localStorage.getItem('roomId'));
  const [paired, setPaired] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
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
      
      if (deviceId) {
        newSocket.emit('register-device', { 
          deviceId, 
          deviceType: 'browser' 
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('paired', ({ roomId: newRoomId }) => {
      setRoomId(newRoomId);
      setPaired(true);
      localStorage.setItem('roomId', newRoomId);
      toast.success('Devices paired successfully!');
    });

    newSocket.on('paired-success', ({ roomId: newRoomId }) => {
      setRoomId(newRoomId);
      setPaired(true);
      localStorage.setItem('roomId', newRoomId);
      toast.success('Paired with mobile device!');
    });

    newSocket.on('pairing-error', ({ message }) => {
      toast.error(message);
    });

    newSocket.on('clipboard-sync', (data) => {
      setClipboard(data);
      toast.success(`${data.type === 'text' ? 'Text' : 'Image'} synced!`);
    });

    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 10));
      toast.success(`${notification.app}: ${notification.title}`);
    });

    newSocket.on('stream-started', () => {
      toast.success('Mobile device started streaming');
    });

    newSocket.on('stream-stopped', () => {
      setIsStreaming(false);
      toast('Stream ended');
    });

    newSocket.on('peer-disconnected', ({ deviceType }) => {
      toast.error(`${deviceType === 'mobile' ? 'Mobile device' : 'Browser'} disconnected`);
      setPaired(false);
      setRoomId(null);
      localStorage.removeItem('roomId');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

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

  const updateClipboard = (type, content) => {
    if (roomId && socket) {
      socket.emit('clipboard-update', { roomId, type, content });
      setClipboard({ type, content, timestamp: Date.now() });
    }
  };

  const requestClipboard = () => {
    if (roomId && socket) {
      socket.emit('clipboard-request', { roomId });
    }
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

  const sendNotification = (notification) => {
    if (roomId && socket) {
      socket.emit('notification', { roomId, notification });
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
    notifications,
    registerDevice,
    pairWithCode,
    updateClipboard,
    requestClipboard,
    startStream,
    stopStream,
    sendNotification
  };

  return (
    <PairingContext.Provider value={value}>
      {children}
    </PairingContext.Provider>
  );
};