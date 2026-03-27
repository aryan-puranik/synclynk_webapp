import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePairing } from '../hooks/usePairing';
import axios from 'axios';
import { FiArrowLeft, FiCamera, FiCopy, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Pair = () => {
  const navigate = useNavigate();
  const { registerDevice, pairWithCode, paired, isConnected } = usePairing();
  const [pairingCode, setPairingCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [mode, setMode] = useState('qr');
  const [isGenerating, setIsGenerating] = useState(false);

  // Navigate only when the PairingContext confirms the handshake is complete
  useEffect(() => {
    if (paired) {
      navigate('/dashboard');
    }
  }, [paired, navigate]);

  const generatePairingCode = async () => {
    if (!isConnected) {
      return toast.error('Waiting for server connection...');
    }
    
    setIsGenerating(true);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const response = await axios.post(`${serverUrl}/api/pair`);
      const { deviceId: newDeviceId, pairingCode: newCode, qrCode: newQrCode } = response.data;
      
      // Update local UI states
      setPairingCode(newCode);
      setQrCode(newQrCode);
      
      // Register with context (triggers socket emit without restarting connection)
      registerDevice(newDeviceId);
      
      toast.success('Pairing code generated!');
    } catch (error) {
      console.error('Pairing error:', error);
      toast.error('Failed to generate pairing code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualPair = () => {
    if (manualCode.length === 6) {
      pairWithCode(manualCode.toUpperCase());
    } else {
      toast.error('Please enter a valid 6-digit code');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center mb-8">
          <Link to="/" className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm mr-4 text-gray-600 dark:text-gray-300">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">Pair Devices</h1>
        </div>

        {!pairingCode ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCamera className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold mb-2 dark:text-white">Ready to Sync?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">Generate a code to link your phone.</p>
            <button
              onClick={generatePairingCode}
              disabled={isGenerating || !isConnected}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center border border-gray-100 dark:border-gray-700">
                <div className="bg-white p-4 rounded-xl mb-4 border border-gray-100">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 px-6 py-3 rounded-xl mb-4">
                  <span className="text-3xl font-mono font-bold tracking-widest text-gray-800 dark:text-white">
                    {pairingCode}
                  </span>
                </div>
                <p className="text-sm text-gray-500 text-center px-4">
                  Scan this QR code or enter the code manually in the SYNCLYNK mobile app.
                </p>
             </div>
             <div className="text-center">
                <button onClick={() => setPairingCode('')} className="text-sm text-blue-500 font-medium">
                  Generate new code
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pair;