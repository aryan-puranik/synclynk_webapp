import { useContext } from 'react';
import { PairingContext } from '../context/PairingContext';

export const useSocket = () => {
  const context = useContext(PairingContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a PairingProvider');
  }
  
  const { socket, isConnected, roomId, deviceId } = context;
  
  return {
    socket,
    isConnected,
    roomId,
    deviceId
  };
};