import React from 'react';
import { FiVideo, FiUsers, FiClock, FiActivity, FiWifi, FiCpu } from 'react-icons/fi';

const StreamStatus = ({ 
  isStreamActive, 
  viewerCount, 
  startedAt, 
  quality, 
  bitrate,
  bufferHealth,
  networkQuality 
}) => {
  const formatDuration = (startTime) => {
    if (!startTime) return '0:00';
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getQualityColor = (qualityValue) => {
    switch(qualityValue) {
      case '1080p': return 'text-purple-500';
      case '720p': return 'text-blue-500';
      case '480p': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getNetworkQualityColor = (quality) => {
    if (quality >= 80) return 'text-green-500';
    if (quality >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBufferHealthColor = (health) => {
    if (health >= 80) return 'text-green-500';
    if (health >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiVideo className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Stream Status
          </h3>
        </div>
        
        {isStreamActive ? (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-500 font-medium">Active</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-xs text-gray-500">Inactive</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Viewers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
          <div className="flex items-center space-x-2">
            <FiUsers className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Viewers</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {viewerCount || 0}
          </p>
        </div>

        {/* Duration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
          <div className="flex items-center space-x-2">
            <FiClock className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Duration</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1 font-mono">
            {formatDuration(startedAt)}
          </p>
        </div>

        {/* Quality */}
        {quality && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <FiActivity className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Quality</span>
            </div>
            <p className={`text-lg font-bold mt-1 ${getQualityColor(quality)}`}>
              {quality}
            </p>
          </div>
        )}

        {/* Bitrate */}
        {bitrate && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <FiCpu className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Bitrate</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {bitrate} kbps
            </p>
          </div>
        )}
      </div>

      {/* Network Quality */}
      {networkQuality !== undefined && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <FiWifi className="w-3 h-3 text-gray-500" />
              <span className="text-gray-500 dark:text-gray-400">Network Quality</span>
            </div>
            <span className={`font-medium ${getNetworkQualityColor(networkQuality)}`}>
              {networkQuality}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                networkQuality >= 80 ? 'bg-green-500' :
                networkQuality >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${networkQuality}%` }}
            />
          </div>
        </div>
      )}

      {/* Buffer Health */}
      {bufferHealth !== undefined && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Buffer Health</span>
            <span className={`font-medium ${getBufferHealthColor(bufferHealth)}`}>
              {bufferHealth}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                bufferHealth >= 80 ? 'bg-green-500' :
                bufferHealth >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${bufferHealth}%` }}
            />
          </div>
        </div>
      )}

      {/* Tips */}
      {!isStreamActive && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            💡 No active stream. Request a stream from your mobile device to start viewing.
          </p>
        </div>
      )}

      {isStreamActive && viewerCount === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
          <p className="text-xs text-yellow-800 dark:text-yellow-300">
            ⚠️ Waiting for viewers. Share your stream with others!
          </p>
        </div>
      )}
    </div>
  );
};

export default StreamStatus;