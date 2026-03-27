import React, { useState } from 'react';
import { 
  FiVideo, FiVideoOff, FiCamera, FiSettings, 
  FiPlay, FiPause, FiMaximize2, FiCheck 
} from 'react-icons/fi';

const StreamControls = ({ 
  isViewing, 
  isStreamActive, 
  onStartViewing, 
  onStopViewing, 
  onRequestStream,
  onToggleFullscreen,
  onQualityChange,
  currentQuality = '720p'
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const qualities = [
    { label: 'Auto', value: 'auto' },
    { label: '1080p', value: '1080p' },
    { label: '720p', value: '720p' },
    { label: '480p', value: '480p' },
    { label: '360p', value: '360p' }
  ];

  const handleRequestStream = async () => {
    setIsRequesting(true);
    await onRequestStream();
    // Simulate request cooldown or wait for socket ack
    setTimeout(() => setIsRequesting(false), 2000);
  };

  return (
    <div className="relative flex items-center w-full justify-between md:justify-start md:space-x-4">
      <div className="flex items-center space-x-2">
        {/* Main Action Button */}
        {!isViewing && isStreamActive ? (
          <button
            onClick={onStartViewing}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full transition-all shadow-lg shadow-green-500/20 flex items-center space-x-2 text-sm font-semibold"
          >
            <FiPlay className="w-4 h-4 fill-current" />
            <span>Start Viewing</span>
          </button>
        ) : isViewing ? (
          <button
            onClick={onStopViewing}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-lg shadow-red-500/20 flex items-center space-x-2 text-sm font-semibold"
          >
            <FiPause className="w-4 h-4 fill-current" />
            <span>Stop Viewing</span>
          </button>
        ) : (
          <button
            onClick={handleRequestStream}
            disabled={isRequesting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center space-x-2 text-sm font-semibold"
          >
            <FiCamera className={`w-4 h-4 ${isRequesting ? 'animate-spin' : ''}`} />
            <span>{isRequesting ? 'Requesting...' : 'Request Stream'}</span>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Fullscreen Toggle (Container Level) */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
            title="Toggle Container Fullscreen"
          >
            <FiMaximize2 className="w-4 h-4" />
          </button>
        )}

        {/* Quality/Settings Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-full transition-all border ${
              showSettings 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Stream Settings"
          >
            <FiSettings className={`w-4 h-4 ${showSettings ? 'rotate-90' : ''} transition-transform duration-300`} />
          </button>

          {showSettings && (
            <>
              {/* Invisible backdrop to close dropdown */}
              <div className="fixed inset-0 z-10" onClick={() => setShowSettings(false)} />
              
              <div className="absolute bottom-full right-0 mb-3 w-44 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-20 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="p-2">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 px-3 py-1">
                    Quality
                  </p>
                  {qualities.map((quality) => (
                    <button
                      key={quality.value}
                      onClick={() => {
                        onQualityChange?.(quality.value);
                        setShowSettings(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-colors ${
                        currentQuality === quality.value
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{quality.label}</span>
                      {currentQuality === quality.value && <FiCheck className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamControls;