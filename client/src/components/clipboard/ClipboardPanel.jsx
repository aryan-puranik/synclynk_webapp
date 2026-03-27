import React, { useState } from 'react';
import { FiCopy, FiImage, FiClock, FiRefreshCw, FiTrash2, FiZap, FiShield } from 'react-icons/fi';
import TextClipboard from './TextClipboard';
import ImageClipboard from './ImageClipboard';
import ClipboardHistory from './ClipboardHistory';
import { useClipboard } from '../../hooks/useClipboard';

const ClipboardPanel = ({ clipboard, onUpdateClipboard, onRequestClipboard }) => {
  const [activeTab, setActiveTab] = useState('text');

  // Updated to use only necessary properties from the hook
  const {
    isLoading,
    permissionGranted,
    requestClipboard,
    clearClipboard,
    requestPermission
  } = useClipboard();

  const handleRequestClipboard = async () => {
    await requestClipboard();
    onRequestClipboard?.();
  };

  const handleClearClipboard = () => {
    if (window.confirm('Are you sure you want to clear the clipboard history?')) {
      clearClipboard();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <FiCopy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Synclynk Clipboard</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Real-time cross-device sync</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRequestClipboard}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
              title="Refresh from mobile"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleClearClipboard}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              title="Clear history"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'text' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <FiCopy className="w-4 h-4" />
          <span>Text</span>
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'image' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <FiImage className="w-4 h-4" />
          <span>Image</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'history' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <FiClock className="w-4 h-4" />
          <span>History</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 bg-white dark:bg-gray-800 min-h-[350px]">
        {activeTab === 'text' && (
          <TextClipboard 
            clipboard={clipboard}
            onUpdateClipboard={onUpdateClipboard}
          />
        )}

        {activeTab === 'image' && (
          <ImageClipboard
            clipboard={clipboard}
            onUpdateClipboard={onUpdateClipboard}
          />
        )}

        {activeTab === 'history' && (
          <ClipboardHistory />
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <FiCopy className="w-3.5 h-3.5" />
              <span>Real-time Sync</span>
            </div>
            
            {/* Permission and Active Status */}
            {!permissionGranted ? (
              <button 
                onClick={requestPermission}
                className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 hover:underline"
              >
                <FiShield className="w-3.5 h-3.5" />
                <span>Auto-sync Paused (Grant Permission)</span>
              </button>
            ) : (
              <span className="flex items-center space-x-1.5 text-green-600 dark:text-green-400">
                <FiZap className="w-3.5 h-3.5" />
                <span>Auto-detecting changes</span>
              </span>
            )}
          </div>
          
          {clipboard && (
            <div className="hidden sm:block">
              Last activity: {new Date(clipboard.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClipboardPanel;