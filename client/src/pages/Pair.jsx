import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePairing } from '../hooks/usePairing';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { FiArrowLeft, FiCamera, FiCopy, FiCheck } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Pair = () => {
  const navigate = useNavigate();
  const { registerDevice, pairWithCode, paired, deviceId: existingDeviceId } = usePairing();
  const [pairingCode, setPairingCode] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState('qr');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (paired) {
      navigate('/dashboard');
    }
  }, [paired, navigate]);

  const generatePairingCode = async () => {
    setIsGenerating(true);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const response = await axios.post(`${serverUrl}/api/pair`);
      const { deviceId: newDeviceId, pairingCode: newCode, qrCode: newQrCode } = response.data;
      
      setDeviceId(newDeviceId);
      setPairingCode(newCode);
      setQrCode(newQrCode);
      registerDevice(newDeviceId);
      
      toast.success('Pairing code generated!');
    } catch (error) {
      console.error('Generate pairing error:', error);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Code copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            to="/"
            className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mr-4"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pair Your Devices
          </h1>
        </div>

        {!pairingCode ? (
          // Initial state - generate QR
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCamera className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Ready to Connect?
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Generate a QR code and scan it with your SYNCLYNK mobile app to establish a secure connection.
            </p>
            
            <button
              onClick={generatePairingCode}
              disabled={isGenerating}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Pairing Code'}
            </button>
          </div>
        ) : (
          // Show QR code and manual code
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setMode('qr')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  mode === 'qr'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                QR Code
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  mode === 'manual'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                Manual Code
              </button>
            </div>

            {mode === 'qr' ? (
              // QR Code View
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-xl mb-6">
                    <img src={qrCode} alt="Pairing QR Code" className="w-64 h-64" />
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                    Scan this QR code with your SYNCLYNK mobile app
                  </p>
                  
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                    <span className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-200">
                      {pairingCode}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <FiCheck className="w-5 h-5 text-green-500" />
                      ) : (
                        <FiCopy className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Code expires in 5 minutes
                  </p>
                </div>
              </div>
            ) : (
              // Manual Code Entry
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                  Enter Pairing Code
                </h3>
                
                <div className="max-w-xs mx-auto">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full px-4 py-3 text-center text-2xl font-mono bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 outline-none text-gray-900 dark:text-white mb-4"
                  />
                  
                  <button
                    onClick={handleManualPair}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
                  >
                    Pair Device
                  </button>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                    Enter the code shown on your mobile device
                  </p>
                </div>
              </div>
            )}
            
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                How to pair:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-blue-700 dark:text-blue-200">
                <li>Open SYNCLYNK app on your mobile device</li>
                <li>Tap on "Scan QR Code" or "Enter Code"</li>
                <li>Scan the QR code above or enter the manual code</li>
                <li>Wait for automatic pairing confirmation</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pair;