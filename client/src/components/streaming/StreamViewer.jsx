import React from 'react';
import { FiRefreshCw, FiActivity, FiShield, FiInfo, FiPlay } from 'react-icons/fi';
import VideoPlayer from './VideoPlayer';
import StreamControls from './StreamControls';
import StreamStatus from './StreamStatus';
import { useWebRTC } from '../../hooks/useWebRTC';

const StreamViewer = ({ isStreamActive, viewerCount }) => {
  const {
    remoteStream,
    isViewing,
    isStreaming,
    isConnecting,
    hasError,
    connectionQuality,
    videoRef,
    startViewing,
    stopViewing,
    requestStream
  } = useWebRTC(); 

  const handleStartViewing = async () => {
    await startViewing();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="relative group rounded-xl overflow-hidden bg-black shadow-2xl">
        <VideoPlayer 
          ref={videoRef} 
          stream={remoteStream} 
          isLive={isStreaming}
          className="w-full h-[70vh] md:h-[80vh]" 
        />

        {/* JOIN LIVE FEED OVERLAY */}
        {isStreamActive && !isViewing && !isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
            <div className="text-center p-8 bg-white/10 rounded-3xl border border-white/20 animate-in fade-in zoom-in">
              <p className="text-white text-xl font-bold mb-6">Mobile device is broadcasting!</p>
              <button
                onClick={handleStartViewing}
                className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center space-x-3 transition-all transform hover:scale-105 shadow-xl shadow-green-500/20"
              >
                <FiPlay className="w-6 h-6 fill-current" />
                <span className="text-lg font-bold">Join Live Feed</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isConnecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-medium">Establishing P2P Link...</p>
          </div>
        )}

        {/* ... Badges and Error Overlays ... */}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <StreamControls 
          isViewing={isViewing}
          isStreamActive={isStreamActive}
          onStartViewing={handleStartViewing}
          onStopViewing={stopViewing}
          onRequestStream={requestStream}
        />
        <StreamStatus 
          isStreamActive={isStreamActive}
          viewerCount={viewerCount}
          connectionQuality={connectionQuality}
          isConnected={isStreaming}
          isConnecting={isConnecting}
        />
      </div>
    </div>
  );
};

export default StreamViewer;