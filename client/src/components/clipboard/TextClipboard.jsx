import React, { useState, useEffect } from 'react';
import { FiCopy, FiCheck, FiDownload, FiMaximize2, FiMinimize2, FiZap, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useClipboard } from '../../hooks/useClipboard';

const TextClipboard = () => {
  const {
    clipboard,
    updateClipboard,
    copyToSystemClipboard,
    permissionGranted,
    requestPermission,
    readFromSystemClipboard
  } = useClipboard();

  const [text, setText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isLocalUpdate, setIsLocalUpdate] = useState(false);

  // ✅ Prevent overwrite from socket echo
  // Fix the useEffect to always update when clipboard changes
useEffect(() => {
  if (clipboard && clipboard.type === 'text') {
    const newText = clipboard.fullContent || clipboard.content;
    
    // Always update text when clipboard changes from socket
    if (newText !== text) {
      console.log('Received new text from socket:', newText.substring(0, 50));
      setText(newText);
      setCharCount(newText?.length || 0);
    }
  }
}, [clipboard, text]); // Added text to dependencies to prevent unnecessary updates




  // ✅ RESTORED (required)
  const handleCopyToSystem = async () => {
    const success = await copyToSystemClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ✅ RESTORED (required + fixed)


  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex space-x-2 flex-wrap gap-2">
          <button
            onClick={handleCopyToSystem}
            disabled={!text}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy to System'}</span>
          </button>


          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
          </button>
        </div>

        {!permissionGranted ? (
          <button
            onClick={requestPermission}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
          >
            <FiShield className="w-4 h-4" />
            <span className="text-sm font-medium">Enable Auto-Sync</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
            <FiZap className="w-4 h-4" />
            <span className="text-sm font-medium">Auto-Sync Active</span>
          </div>
        )}
      </div>
      <div className="text-sm text-green-600 font-medium">
        🔄 Live Clipboard Sync Active
      </div>

      {/* Text Area */}
      <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4' : ''}`}>
        <textarea
          value={text}
          readOnly
          placeholder="Type or paste content here..."
          className={`w-full border rounded-lg ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-64'} p-4`}
        />

        <div className="absolute bottom-2 right-2 text-xs">
          {charCount} characters
        </div>
      </div>
    </div>
  );
};

export default TextClipboard;