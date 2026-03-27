import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePairing } from '../hooks/usePairing';
import { useTheme } from '../hooks/useTheme';
import { useClipboard } from '../hooks/useClipboard';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import ClipboardPanel from '../components/clipboard/ClipboardPanel';
import StreamViewer from '../components/streaming/StreamViewer';
import NotificationPanel from '../components/notifications/NotificationPanel';
import { FiCopy, FiVideo, FiBell, FiSettings } from 'react-icons/fi';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isConnected, roomId, deviceId, paired, isStreaming, viewerCount } = usePairing();
  const { isDark, toggleTheme } = useTheme();
  const { clipboard, updateClipboard, requestClipboard } = useClipboard();

  const [activeTab, setActiveTab] = useState('clipboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const tabs = [
    { id: 'clipboard', label: 'Clipboard', icon: <FiCopy className="w-5 h-5" /> },
    { id: 'streaming', label: 'Streaming', icon: <FiVideo className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell className="w-5 h-5" />, badge: 0 },
    { id: 'settings', label: 'Settings', icon: <FiSettings className="w-5 h-5" /> },
  ];

  useEffect(() => {
    if (!paired && !roomId) { navigate('/pair'); }
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
                <h1 className="text-2xl font-bold flex items-center mb-6">
                  <FiCopy className="mr-2 text-blue-500" /> Shared Clipboard
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
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Video Stream</h2>
                      {isStreaming && (
                        <p className="text-sm text-green-500 mt-1 flex items-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span>Live • {viewerCount} viewer{viewerCount !== 1 ? 's' : ''}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <StreamViewer
                    isStreamActive={isStreaming}
                    viewerCount={viewerCount}
                  />
                </div>
              </div>
            )}
            {/* ... other tabs ... */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;