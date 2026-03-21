import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePairing } from '../context/PairingContext';
import { useTheme } from '../context/ThemeContext';
import { FiCopy, FiVideo, FiBell, FiLogOut, FiImage, FiX, FiCamera, FiMonitor } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const {
    paired,
    clipboard,
    isStreaming,
    notifications,
    updateClipboard,
    requestClipboard,
    startStream,
    stopStream
  } = usePairing();

  const [activeTab, setActiveTab] = useState('clipboard');
  const [textInput, setTextInput] = useState('');
  const [images, setImages] = useState([]);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isViewingStream, setIsViewingStream] = useState(false);
  
  const videoRef = useRef();
  const peerConnection = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    if (!paired) {
      navigate('/');
    }
  }, [paired, navigate]);

  useEffect(() => {
    if (clipboard) {
      if (clipboard.type === 'text') {
        setTextInput(clipboard.content);
      } else if (clipboard.type === 'image') {
        setImages(prev => [clipboard.content, ...prev].slice(0, 5));
      }
    }
  }, [clipboard]);

  // WebRTC setup for receiving stream
  useEffect(() => {
    if (isStreaming && !peerConnection.current) {
      setupWebRTC();
    }
  }, [isStreaming]);

  const setupWebRTC = async () => {
    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    peerConnection.current = new RTCPeerConnection(configuration);

    peerConnection.current.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
        setIsViewingStream(true);
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to mobile
      }
    };
  };

  const handleTextCopy = () => {
    if (textInput.trim()) {
      updateClipboard('text', textInput);
      navigator.clipboard.writeText(textInput);
      toast.success('Text copied to clipboard and synced');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        updateClipboard('image', imageData);
        toast.success('Image copied to clipboard and synced');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            updateClipboard('image', event.target.result);
            toast.success('Image pasted and synced');
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    }
  };

  const handleRequestClipboard = () => {
    requestClipboard();
    toast.success('Requesting clipboard from mobile');
  };

  const handleStartStream = () => {
    startStream();
    toast.success('Waiting for mobile stream...');
  };

  const handleStopStream = () => {
    stopStream();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsViewingStream(false);
    toast.success('Stream ended');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                SYNCLYNK Dashboard
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                {isDark ? '🌞' : '🌙'}
              </button>
              
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/');
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('clipboard')}
            className={`flex items-center space-x-2 px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'clipboard'
                ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FiCopy className="w-5 h-5" />
            <span>Universal Clipboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('stream')}
            className={`flex items-center space-x-2 px-4 py-2 font-medium transition-colors ${
              activeTab === 'stream'
                ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FiVideo className="w-5 h-5" />
            <span>Live Stream</span>
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center space-x-2 px-4 py-2 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FiBell className="w-5 h-5" />
            <span>Notifications</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          {activeTab === 'clipboard' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Universal Clipboard
                </h2>
                <button
                  onClick={handleRequestClipboard}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Request from Mobile
                </button>
              </div>
              
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text Clipboard
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Type or paste text/image here..."
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleTextCopy}
                    disabled={!textInput.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Copy & Sync Text
                  </button>
                </div>
              </div>
              
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Clipboard
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex flex-col items-center space-y-2"
                >
                  <FiImage className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">
                    Click to upload or paste image
                  </span>
                </button>
              </div>
              
              {/* Recent Images */}
              {images.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recent Images
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => updateClipboard('image', image)}
                      >
                        <img
                          src={image}
                          alt={`Clipboard ${index}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                          <FiCopy className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stream' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Live Video Stream
              </h2>
              
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                {isViewingStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <FiCamera className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg opacity-50">
                      {isStreaming ? 'Waiting for stream...' : 'No active stream'}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 justify-center">
                {!isStreaming ? (
                  <button
                    onClick={handleStartStream}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                  >
                    <FiVideo className="w-5 h-5" />
                    <span>Request Stream from Mobile</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopStream}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                  >
                    <FiX className="w-5 h-5" />
                    <span>Stop Stream</span>
                  </button>
                )}
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Start streaming from your mobile device to view it here
              </p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Mobile Notifications
              </h2>
              
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <FiBell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No notifications yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Notifications from messaging apps will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-blue-500 dark:text-blue-400">
                          {notification.app}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {notification.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;