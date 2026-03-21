import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const PairingContext = createContext();

export const usePairing = () => useContext(PairingContext);

export const PairingProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [deviceId, setDeviceId] = useState(localStorage.getItem('deviceId'));
  const [roomId, setRoomId] = useState(localStorage.getItem('roomId'));
  const [paired, setPaired] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('paired', ({ roomId }) => {
      setRoomId(roomId);
      setPaired(true);
      localStorage.setItem('roomId', roomId);
      toast.success('Devices paired successfully!');
    });

    newSocket.on('paired-success', ({ roomId }) => {
      setRoomId(roomId);
      setPaired(true);
      localStorage.setItem('roomId', roomId);
      toast.success('Paired with mobile device!');
    });

    newSocket.on('pairing-error', ({ message }) => {
      toast.error(message);
    });

    newSocket.on('clipboard-sync', (data) => {
      setClipboard(data);
      toast.success(`${data.type === 'text' ? 'Text' : 'Image'} copied to clipboard!`);
    });

    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 10));
      toast.custom((t) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="font-bold">{notification.app}</h3>
          <p>{notification.title}</p>
          <p className="text-sm text-gray-500">{notification.message}</p>
        </div>
      ));
    });

    newSocket.on('stream-started', () => {
      toast.success('Mobile device started streaming');
    });

    newSocket.on('stream-stopped', () => {
      setIsStreaming(false);
      toast('Stream ended');
    });

    if (deviceId) {
      newSocket.emit('register-device', { 
        deviceId, 
        deviceType: 'web' 
      });
    }

    return () => newSocket.close();
  }, []);

  const registerDevice = (newDeviceId) => {
    setDeviceId(newDeviceId);
    localStorage.setItem('deviceId', newDeviceId);
    socket?.emit('register-device', { 
      deviceId: newDeviceId, 
      deviceType: 'web' 
    });
  };

  const pairWithCode = (pairingCode) => {
    socket?.emit('pair-with-code', { pairingCode, deviceId });
  };

  const updateClipboard = (type, content) => {
    if (roomId) {
      socket?.emit('clipboard-update', { roomId, type, content });
      setClipboard({ type, content });
    }
  };

  const requestClipboard = () => {
    if (roomId) {
      socket?.emit('clipboard-request', { roomId });
    }
  };

  const startStream = () => {
    if (roomId) {
      socket?.emit('start-stream', { roomId });
      setIsStreaming(true);
    }
  };

  const stopStream = () => {
    if (roomId) {
      socket?.emit('stop-stream', { roomId });
      setIsStreaming(false);
    }
  };

  const sendNotification = (notification) => {
    if (roomId) {
      socket?.emit('notification', { roomId, notification });
    }
  };

  return (
    <PairingContext.Provider value={{
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
    }}>
      {children}
    </PairingContext.Provider>
  );
};