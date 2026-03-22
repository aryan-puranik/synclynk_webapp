import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { FiCopy, FiImage, FiFileText, FiDownload, FiTrash2, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ClipboardHistory = () => {
  const { socket, roomId } = useSocket();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'text', 'image'

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleHistoryResponse = (data) => {
      setHistory(data);
      setIsLoading(false);
    };

    socket.on('clipboard-history-response', handleHistoryResponse);
    
    // Request history
    socket.emit('clipboard-history', { limit: 50 });
    
    return () => {
      socket.off('clipboard-history-response', handleHistoryResponse);
    };
  }, [socket, roomId]);

  const handleCopyToClipboard = async (item) => {
    try {
      if (item.type === 'text') {
        await navigator.clipboard.writeText(item.fullContent || item.content);
        toast.success('Copied to system clipboard');
      } else if (item.type === 'image') {
        // For images, we'll download instead
        handleDownload(item);
      }
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleDownload = (item) => {
    if (item.type === 'text') {
      const blob = new Blob([item.fullContent || item.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clipboard-${item.id || Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Text downloaded');
    } else if (item.type === 'image') {
      const link = document.createElement('a');
      link.href = item.fullContent || item.content;
      link.download = `clipboard-image-${item.id || Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type) => {
    return type === 'text' ? <FiFileText className="w-5 h-5" /> : <FiImage className="w-5 h-5" />;
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          All ({history.length})
        </button>
        
        <button
          onClick={() => setFilter('text')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            filter === 'text'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          Text ({history.filter(i => i.type === 'text').length})
        </button>
        
        <button
          onClick={() => setFilter('image')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            filter === 'image'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          Image ({history.filter(i => i.type === 'image').length})
        </button>
      </div>
      
      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12">
          <FiClock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No clipboard history</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Your clipboard items will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredHistory.map((item, index) => (
            <div
              key={item.id || index}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(item.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">
                        {item.type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    
                    {item.type === 'text' ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                        {item.fullContent || item.content}
                      </p>
                    ) : (
                      <div className="mt-1">
                        <img
                          src={item.fullContent || item.content}
                          alt="Clipboard preview"
                          className="max-w-full h-20 object-cover rounded"
                        />
                      </div>
                    )}
                    
                    {item.size && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Size: {item.type === 'text' ? `${item.size} characters` : `${Math.round(item.size / 1024)} KB`}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-3">
                  <button
                    onClick={() => handleCopyToClipboard(item)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    <FiCopy className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Download"
                  >
                    <FiDownload className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Info */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400">
        <p>📋 History stores up to 50 recent clipboard items. Items are automatically cleared after 1 hour.</p>
      </div>
    </div>
  );
};

export default ClipboardHistory;