import { useContext } from 'react';
import { PairingContext } from '../context/PairingContext';

export const usePairing = () => {
  const context = useContext(PairingContext);
  
  if (!context) {
    throw new Error('usePairing must be used within a PairingProvider');
  }
  
  return context;
};