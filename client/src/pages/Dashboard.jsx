import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePairing } from '../hooks/usePairing';
import { useTheme } from '../hooks/useTheme';
import { useClipboard } from '../hooks/useClipboard';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import ClipboardPanel from '../components/clipboard/ClipboardPanel';
import VideoPlayer from '../components/streaming/VideoPlayer';
import StreamControls from '../components/streaming/StreamControls';
import NotificationPanel from '../components/notifications/NotificationPanel';
import { FiCopy, FiVideo, FiBell, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isConnected, roomId, deviceId, paired } = usePairing();
  const { isDark, toggleTheme } = useTheme();
  const { clipboard, updateClipboard, requestClipboard } = useClipboard();

  const [activeTab, setActiveTab] = useState('clipboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isViewing, setIsViewing] = useState(false);
  const [streamInfo, setStreamInfo] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);

  // Define the tabs for the Sidebar
  const tabs = [
    { id: 'clipboard', label: 'Clipboard', icon: <FiCopy className="w-5 h-5" /> },
    { id: 'streaming', label: 'Streaming', icon: <FiVideo className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell className="w-5 h-5" />, badge: 0 },
    { id: 'settings', label: 'Settings', icon: <FiSettings className="w-5 h-5" /> },
  ];

  useEffect(() => {
    if (!paired && !roomId) {
      navigate('/pair');
    }
  }, [paired, roomId, navigate]);

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Header 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        sidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isConnected={isConnected}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          tabs={tabs}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'clipboard' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold flex items-center">
                    <FiCopy className="mr-2 text-blue-500" />
                    Shared Clipboard
                  </h1>
                </div>
                <ClipboardPanel 
                  clipboard={clipboard}
                  onUpdateClipboard={updateClipboard}
                  onRequestClipboard={requestClipboard}
                />
              </div>
            )}

            {activeTab === 'streaming' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold flex items-center mb-6">
                  <FiVideo className="mr-2 text-purple-500" />
                  Video Streaming
                </h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <VideoPlayer isViewing={isViewing} streamInfo={streamInfo} />
                  </div>
                  <StreamControls 
                    isViewing={isViewing}
                    setIsViewing={setIsViewing}
                    setStreamInfo={setStreamInfo}
                    viewerCount={viewerCount}
                    setViewerCount={setViewerCount}
                  />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold flex items-center mb-6">
                  <FiBell className="mr-2 text-red-500" />
                  Notifications
                </h1>
                <NotificationPanel />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold flex items-center mb-6">
                  <FiSettings className="mr-2 text-gray-500" />
                  Settings
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Connection Info</h3>
                    <div className="space-y-3 text-sm">
                      <p><span className="font-medium">Device ID:</span> <code className="ml-2 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{deviceId}</code></p>
                      <p><span className="font-medium">Room ID:</span> <span className="ml-2 font-mono">{roomId}</span></p>
                      <p><span className="font-medium">Status:</span> <span className={isConnected ? 'text-green-500' : 'text-red-500'}>{isConnected ? 'Connected' : 'Disconnected'}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;