import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { FiCopy, FiImage, FiFileText, FiDownload, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

// 🔹 Image hash helper (same logic as hook)
const getImageHash = (dataUrl) => {
  if (!dataUrl) return '';
  const raw = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return raw.slice(0, 128);
};

// 🔹 Strong deduplication
const dedupeHistory = (data) => {
  const seenIds = new Set();
  const seenContent = new Set();

  return data.filter(item => {
    // Deduplicate by ID
    if (item.id && seenIds.has(item.id)) return false;
    if (item.id) seenIds.add(item.id);

    const content = item.fullContent || item.content;

    // Deduplicate by content
    if (item.type === 'image') {
      const hash = getImageHash(content);
      if (seenContent.has(hash)) return false;
      seenContent.add(hash);
    } else {
      if (seenContent.has(content)) return false;
      seenContent.add(content);
    }

    return true;
  });
};

const ClipboardHistory = () => {
  const { socket, roomId } = useSocket();

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleHistoryResponse = (data) => {
      // console.log('📜 Raw history:', data);

      const cleaned = dedupeHistory(data);

      // console.log('✅ Deduped history:', cleaned);

      setHistory(cleaned);
      setIsLoading(false);
    };

    socket.on('clipboard-history-response', handleHistoryResponse);

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
      } else {
        handleDownload(item);
      }
    } catch {
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
    } else {
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
    return type === 'text'
      ? <FiFileText className="w-5 h-5" />
      : <FiImage className="w-5 h-5" />;
  };

  // ✅ NO MORE duplicate filtering here
  const filteredHistory = history.filter(item =>
    filter === 'all' ? true : item.type === filter
  );

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
        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-lg text-sm ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
          All ({history.length})
        </button>

        <button onClick={() => setFilter('text')} className={`px-3 py-1 rounded-lg text-sm ${filter === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
          Text ({history.filter(i => i.type === 'text').length})
        </button>

        <button onClick={() => setFilter('image')} className={`px-3 py-1 rounded-lg text-sm ${filter === 'image' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
          Image ({history.filter(i => i.type === 'image').length})
        </button>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12">
          <FiClock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No clipboard history</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredHistory.map((item, index) => (
            <div key={item.id || index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex space-x-3 flex-1">
                  {getIcon(item.type)}

                  <div className="flex-1">
                    <div className="flex space-x-2 mb-1">
                      <span className="text-xs text-blue-500 uppercase">{item.type}</span>
                      <span className="text-xs text-gray-500">{formatDate(item.timestamp)}</span>
                    </div>

                    {item.type === 'text' ? (
                      <p className="text-sm break-all">{item.fullContent || item.content}</p>
                    ) : (
                      <img src={item.fullContent || item.content} className="h-20 rounded" />
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button onClick={() => handleCopyToClipboard(item)}>
                    <FiCopy />
                  </button>
                  <button onClick={() => handleDownload(item)}>
                    <FiDownload />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClipboardHistory;