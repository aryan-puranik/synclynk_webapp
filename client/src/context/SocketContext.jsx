import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState(localStorage.getItem('roomId'));
  const [deviceId, setDeviceId] = useState(localStorage.getItem('deviceId'));

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');
    
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Register device if we have deviceId
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
      localStorage.setItem('roomId', newRoomId);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    roomId,
    deviceId,
    setRoomId,
    setDeviceId
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};