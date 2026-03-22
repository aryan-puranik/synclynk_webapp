import React, { forwardRef, useState } from 'react';
import { FiMaximize, FiMinimize, FiVolume2, FiVolumeX } from 'react-icons/fi';

const VideoPlayer = forwardRef(({ stream, className, autoPlay = true }, ref) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    if (ref.current) {
      ref.current.muted = !ref.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (ref.current) {
      if (isPlaying) {
        ref.current.pause();
      } else {
        ref.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={`relative group bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={ref}
        autoPlay={autoPlay}
        playsInline
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />
      
      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <button
              onClick={toggleMute}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isMuted ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
            </button>
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isFullscreen ? <FiMinimize className="w-5 h-5" /> : <FiMaximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {/* No Stream Overlay */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Waiting for stream...</p>
          </div>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;