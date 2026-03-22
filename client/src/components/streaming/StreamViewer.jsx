import React, { useState, useRef, useEffect } from 'react';
import { FiMaximize2, FiMinimize2, FiVolume2, FiVolumeX, FiPlay, FiPause } from 'react-icons/fi';
import StreamControls from './StreamControls';
import StreamStatus from './StreamStatus';

const StreamViewer = ({ 
  videoRef, 
  isViewing, 
  isStreamActive, 
  streamInfo, 
  viewerCount,
  onStartViewing,
  onStopViewing,
  onRequestStream,
  onQualityChange
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [bufferHealth, setBufferHealth] = useState(100);
  const [networkQuality, setNetworkQuality] = useState(100);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!videoRef?.current) return;

    const video = videoRef.current;
    
    const handleWaiting = () => {
      setBufferHealth(prev => Math.max(0, prev - 10));
    };
    
    const handlePlaying = () => {
      setBufferHealth(100);
    };
    
    const handleStalled = () => {
      setBufferHealth(prev => Math.max(0, prev - 20));
    };

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('stalled', handleStalled);
    
    // Simulate network quality monitoring
    const interval = setInterval(() => {
      if (isViewing && isStreamActive) {
        // Simulate network quality based on buffer health
        const simulatedQuality = Math.min(100, Math.max(0, bufferHealth + (Math.random() * 10 - 5)));
        setNetworkQuality(Math.floor(simulatedQuality));
      }
    }, 5000);
    
    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('stalled', handleStalled);
      clearInterval(interval);
    };
  }, [videoRef, isViewing, isStreamActive, bufferHealth]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    if (videoRef?.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef?.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden shadow-xl"
        style={{ aspectRatio: '16/9' }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
          onClick={togglePlay}
        />
        
        {/* Video Controls Overlay */}
        {isViewing && isStreamActive && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isMuted ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
                </button>
                
                {/* Volume Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="100"
                  onChange={(e) => {
                    if (videoRef?.current) {
                      videoRef.current.volume = e.target.value / 100;
                      if (videoRef.current.volume > 0 && isMuted) {
                        setIsMuted(false);
                        videoRef.current.muted = false;
                      }
                    }
                  }}
                  className="w-24 h-1 bg-gray-400 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isFullscreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
        
        {/* Stream Status Overlay */}
        {!isViewing && isStreamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg font-semibold mb-2">Stream Available</p>
              <p className="text-gray-300 text-sm">Click "Start Viewing" to watch</p>
            </div>
          </div>
        )}
        
        {!isStreamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📺</span>
              </div>
              <p className="text-white text-lg font-semibold mb-2">No Active Stream</p>
              <p className="text-gray-400 text-sm">Request a stream from your mobile device</p>
            </div>
          </div>
        )}
        
        {/* Live Badge */}
        {isStreamActive && (
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          </div>
        )}
        
        {/* Viewer Count Badge */}
        {isStreamActive && viewerCount > 0 && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
            <span>👁️</span>
            <span>{viewerCount}</span>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="flex justify-between items-center">
        <StreamControls 
          isViewing={isViewing}
          isStreamActive={isStreamActive}
          onStartViewing={onStartViewing}
          onStopViewing={onStopViewing}
          onRequestStream={onRequestStream}
          onToggleFullscreen={toggleFullscreen}
          onQualityChange={onQualityChange}
          currentQuality={streamInfo?.config?.quality}
        />
      </div>
      
      {/* Status Panel */}
      <StreamStatus 
        isStreamActive={isStreamActive}
        viewerCount={viewerCount}
        startedAt={streamInfo?.startedAt}
        quality={streamInfo?.config?.quality}
        bitrate={streamInfo?.config?.bitrate}
        bufferHealth={bufferHealth}
        networkQuality={networkQuality}
      />
      
      {/* Tips for Stream Viewing */}
      {!isStreamActive && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            How to start streaming:
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-200">
            <li>Open SYNCLYNK app on your mobile device</li>
            <li>Navigate to the Stream section</li>
            <li>Tap "Start Streaming" button</li>
            <li>Your camera feed will appear here instantly</li>
          </ol>
        </div>
      )}
      
      {isStreamActive && !isViewing && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-300">
            🎥 A stream is available! Click "Start Viewing" to watch the live feed from your mobile device.
          </p>
        </div>
      )}
      
      {isViewing && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <p className="text-sm text-purple-800 dark:text-purple-300">
            📱 You're now viewing the live stream. The stream is end-to-end encrypted and doesn't pass through our servers.
          </p>
        </div>
      )}
    </div>
  );
};

export default StreamViewer;