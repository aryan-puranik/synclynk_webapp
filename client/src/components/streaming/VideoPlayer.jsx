import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { 
  FiMaximize, FiMinimize, FiVolume2, FiVolumeX, 
  FiPlay, FiPause 
} from 'react-icons/fi';

const VideoPlayer = forwardRef(({ stream, className = "", autoPlay = true, isLive = false }, ref) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const containerRef = useRef(null);

  // Sync internal state with the video element when ref changes
  useEffect(() => {
    if (ref.current) {
      ref.current.muted = isMuted;
      ref.current.volume = volume;
    }
  }, [ref, isMuted, volume]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const togglePlay = () => {
    if (ref.current) {
      isPlaying ? ref.current.pause() : ref.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative group bg-black rounded-lg overflow-hidden border border-gray-800 ${className}`}
    >
      <video
        ref={ref}
        autoPlay={autoPlay}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
      />
      
      {/* Media Controls Overlay */}
      {stream && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center space-x-2 group/vol">
                <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-blue-400 transition-colors">
                  {isMuted || volume === 0 ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={isMuted ? 0 : volume * 100}
                  onChange={(e) => handleVolumeChange({ target: { value: e.target.value / 100 } })}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
            
            <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors">
              {isFullscreen ? <FiMinimize className="w-5 h-5" /> : <FiMaximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Loading State Overlay */}
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Waiting for peer stream...</p>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;