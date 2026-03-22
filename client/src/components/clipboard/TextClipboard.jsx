import React, { useState, useEffect } from 'react';
import { FiCopy, FiCheck, FiDownload, FiMaximize2, FiMinimize2, FiZap, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useClipboard } from '../../hooks/useClipboard';

const TextClipboard = () => {
  const { 
    clipboard, 
    updateClipboard, 
    autoSyncText,
    copyToSystemClipboard,
    permissionGranted,
    requestPermission
  } = useClipboard();
  
  const [text, setText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (clipboard && clipboard.type === 'text') {
      const newText = clipboard.fullContent || clipboard.content;
      setText(newText);
      setCharCount(newText?.length || 0);
    }
  }, [clipboard]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setCharCount(newText.length);
    
    // Auto-sync is now the default behavior
    autoSyncText(newText);
  };

  const handleSyncText = () => {
    if (text.trim()) {
      updateClipboard('text', text);
      toast.success('Manually synced to mobile');
    } else {
      toast.error('Please enter some text');
    }
  };

  const handleCopyToSystem = async () => {
    const success = await copyToSystemClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePaste = async () => {
    try {
      const pastedText = await navigator.clipboard.readText();
      setText(pastedText);
      setCharCount(pastedText.length);
      
      // Auto-sync immediately after pasting
      autoSyncText(pastedText);
      
      toast.success('Text pasted from system clipboard');
    } catch (error) {
      toast.error('Failed to paste. Please allow clipboard permissions');
    }
  };

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
            onClick={handlePaste}
            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <FiDownload className="w-4 h-4" />
            <span>Paste from System</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Permission / Status Indicator */}
        {!permissionGranted ? (
          <button 
            onClick={requestPermission}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 transition-all hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
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

      {/* Text Area Container */}
      <div className={`relative transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4' : ''}`}>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Type or paste content here... Changes are automatically synced to mobile"
          className={`w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-white resize-none ${
            isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-64'
          } p-4 font-mono text-sm`}
        />
        
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded backdrop-blur-sm">
          {charCount} characters
        </div>
      </div>
      
      {/* Manual sync fallback */}
      <div className="flex justify-end">
        <button
          onClick={handleSyncText}
          disabled={!text}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 font-medium flex items-center space-x-2"
        >
          <span>Sync Now</span>
        </button>
      </div>
    </div>
  );
};

export default TextClipboard;