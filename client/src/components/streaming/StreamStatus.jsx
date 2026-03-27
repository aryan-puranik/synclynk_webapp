import React from 'react';
import { FiVideo, FiUsers, FiWifi, FiShield, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const StreamStatus = ({ 
  isStreamActive, 
  viewerCount, 
  connectionQuality,
  isConnected,
  isConnecting
}) => {
  const getQualityColor = (quality) => {
    if (quality >= 80) return 'text-green-500';
    if (quality >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getQualityText = (quality) => {
    if (quality >= 80) return 'Excellent';
    if (quality >= 60) return 'Good';
    if (quality >= 40) return 'Fair';
    if (quality >= 20) return 'Poor';
    return 'Very Poor';
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-700/50 space-y-4">
      {/* Header & Connection Indicators */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiVideo className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">
            Live Status
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <div className="flex items-center space-x-1.5 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">Connected</span>
            </div>
          ) : isConnecting ? (
            <div className="flex items-center space-x-1.5 bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/20">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-wider">Joining...</span>
            </div>
          ) : isStreamActive ? (
            <div className="flex items-center space-x-1.5 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Mobile Live</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-gray-500/10 px-2 py-1 rounded-md border border-gray-500/20">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Viewer Stats */}
        <div className="bg-white dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/30">
          <div className="flex items-center space-x-2 mb-1">
            <FiUsers className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Viewers</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {viewerCount || 0}
          </p>
        </div>

        {/* Connection/Latency Metric */}
        <div className="bg-white dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/30">
          <div className="flex items-center space-x-2 mb-1">
            <FiWifi className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Link Health</span>
          </div>
          <p className={`text-sm font-bold ${getQualityColor(connectionQuality)}`}>
            {isConnected ? getQualityText(connectionQuality) : 'N/A'}
          </p>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 rounded-full mt-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isConnected ? 'bg-blue-500' : 'bg-gray-300'}`}
              style={{ width: isConnected ? `${connectionQuality}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Context-Aware Alerts */}
      <div className="pt-2">
        {!isStreamActive ? (
          <div className="flex items-start space-x-3 bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
            <FiAlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Mobile app is currently offline. Start a stream on your mobile device to view it here.
            </p>
          </div>
        ) : !isConnected && !isConnecting ? (
          <div className="flex items-start space-x-3 bg-green-500/5 p-3 rounded-xl border border-green-500/10 animate-pulse">
            <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed font-medium">
              Mobile stream detected! Click "Join Live Feed" to establish a secure P2P connection.
            </p>
          </div>
        ) : isConnected && (
          <div className="flex items-start space-x-2 bg-gray-900/5 dark:bg-white/5 p-2 rounded-lg">
            <FiShield className="w-3.5 h-3.5 text-green-500 mt-0.5" />
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              WebRTC connection active. Media is encrypted and transmitted directly between devices.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamStatus;