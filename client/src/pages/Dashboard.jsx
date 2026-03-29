import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePairing } from '../hooks/usePairing';
import { useTheme } from '../hooks/useTheme';
import { useClipboard } from '../hooks/useClipboard';
import { useNotifications } from '../hooks/useNotifications'; // Import notifications hook
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import ClipboardPanel from '../components/clipboard/ClipboardPanel';
import StreamViewer from '../components/streaming/StreamViewer';
import NotificationPanel from '../components/notifications/NotificationPanel';
import { FiCopy, FiVideo, FiBell, FiSettings } from 'react-icons/fi';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isConnected, roomId, deviceId, paired, isStreaming, viewerCount, disconnect } = usePairing();
  const { isDark, toggleTheme } = useTheme();
  const { clipboard, updateClipboard, requestClipboard } = useClipboard();
  const { unreadCount } = useNotifications(); // Get live unread count

  const [activeTab, setActiveTab] = useState('clipboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Updated tabs to show live unread count
  const tabs = [
    { id: 'clipboard', label: 'Clipboard', icon: <FiCopy className="w-5 h-5" /> },
    { id: 'streaming', label: 'Streaming', icon: <FiVideo className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell className="w-5 h-5" />, badge: unreadCount },
    { id: 'settings', label: 'Settings', icon: <FiSettings className="w-5 h-5" /> },
  ];

  useEffect(() => {
    if (!paired && !roomId) { navigate('/pair'); }
  }, [paired, roomId, navigate]);

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Header
        deviceId={deviceId}
        roomId={roomId}
        isConnected={isConnected}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onDisconnect={disconnect}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          tabs={tabs}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-950">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'clipboard' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold flex items-center mb-6">
                  <FiCopy className="mr-3 text-blue-500" /> Shared Clipboard
                </h1>
                <ClipboardPanel
                  clipboard={clipboard}
                  onUpdateClipboard={updateClipboard}
                  onRequestClipboard={requestClipboard}
                />
              </div>
            )}

            {activeTab === 'streaming' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Camera Feed</h2>
                      {isStreaming && (
                        <p className="text-sm text-green-500 mt-1 flex items-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span>Streaming Live • {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <StreamViewer isStreamActive={isStreaming} viewerCount={viewerCount} />
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold flex items-center mb-6">
                  <FiBell className="mr-3 text-red-500" /> Mirror Notifications
                </h1>
                <NotificationPanel />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold flex items-center mb-6">
                  <FiSettings className="mr-3 text-gray-500" /> Dashboard Settings
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Connection Information</h3>
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Device Identifier</p>
                        <code className="bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-lg block font-mono text-sm border border-gray-200 dark:border-gray-700">
                          {deviceId}
                        </code>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Active Room ID</p>
                        <p className="font-mono text-lg text-blue-500 font-bold">{roomId}</p>
                      </div>
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Socket Status</span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${isConnected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </div>
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