import React, { useState } from 'react';
import { FiVideo, FiVideoOff, FiMonitor, FiCamera, FiSettings, FiPlay, FiPause, FiMaximize2 } from 'react-icons/fi';

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
    setTimeout(() => setIsRequesting(false), 2000);
  };

  const handleStartViewing = () => {
    onStartViewing();
  };

  const handleStopViewing = () => {
    onStopViewing();
  };

  return (
    <div className="relative">
      {/* Main Controls */}
      <div className="flex items-center space-x-3">
        {!isViewing && isStreamActive && (
          <button
            onClick={handleStartViewing}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <FiPlay className="w-4 h-4" />
            <span>Start Viewing</span>
          </button>
        )}

        {isViewing && (
          <button
            onClick={handleStopViewing}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
          >
            <FiPause className="w-4 h-4" />
            <span>Stop Viewing</span>
          </button>
        )}

        {!isStreamActive && (
          <button
            onClick={handleRequestStream}
            disabled={isRequesting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <FiCamera className={`w-4 h-4 ${isRequesting ? 'animate-pulse' : ''}`} />
            <span>{isRequesting ? 'Requesting...' : 'Request Stream'}</span>
          </button>
        )}

        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            title="Fullscreen"
          >
            <FiMaximize2 className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors relative"
          title="Stream Settings"
        >
          <FiSettings className="w-4 h-4" />
          {showSettings && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <div className="p-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
                  Video Quality
                </p>
                {qualities.map((quality) => (
                  <button
                    key={quality.value}
                    onClick={() => {
                      onQualityChange?.(quality.value);
                      setShowSettings(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      currentQuality === quality.value
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {quality.label}
                    {currentQuality === quality.value && (
                      <span className="float-right">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Status Indicator */}
      {isStreamActive && (
        <div className="absolute -top-8 right-0 flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-500 font-medium">LIVE</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamControls;