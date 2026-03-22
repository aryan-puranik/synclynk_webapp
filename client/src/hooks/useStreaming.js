import { useState, useCallback, useEffect, useRef } from 'react';
import webrtcService from '../services/webrtcService';
import { useSocket } from './useSocket';
import toast from 'react-hot-toast';

export const useStreaming = () => {
  const { socket, roomId, deviceId } = useSocket();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [streamInfo, setStreamInfo] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState(null);
  const [currentQuality, setCurrentQuality] = useState('720p');
  
  const videoRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for webrtc track events
    webrtcService.on('track', (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsViewing(true);
      }
    });

    webrtcService.on('connected', () => {
      toast.success('Stream connected');
    });

    webrtcService.on('connection-failed', () => {
      toast.error('Stream connection failed');
      cleanup();
    });

    webrtcService.on('error', (err) => {
      setError(err);
      toast.error(`Stream error: ${err.message}`);
    });

    // Socket event handlers
    const handleStreamStarted = ({ streamerId, config }) => {
      setStreamInfo({ isActive: true, config, streamerId, startedAt: Date.now() });
      toast.success('Mobile device started streaming');
    };

    const handleStreamStopped = () => {
      setIsStreaming(false);
      setIsViewing(false);
      setStreamInfo(null);
      setViewerCount(0);
      cleanup();
      toast('Stream ended');
    };

    const handleViewerJoined = ({ viewerId, totalViewers }) => {
      setViewerCount(totalViewers);
      if (viewerId !== deviceId) {
        toast.success(`New viewer joined (${totalViewers} total)`);
      }
    };

    const handleViewerLeft = ({ totalViewers }) => {
      setViewerCount(totalViewers);
    };

    const handleStreamInfo = (info) => {
      setStreamInfo(prev => ({ ...prev, ...info }));
      setViewerCount(info.viewerCount || 0);
    };

    const handleStreamError = ({ message }) => {
      setError(message);
      toast.error(`Stream error: ${message}`);
    };

    socket.on('stream-started', handleStreamStarted);
    socket.on('stream-stopped', handleStreamStopped);
    socket.on('viewer-joined', handleViewerJoined);
    socket.on('viewer-left', handleViewerLeft);
    socket.on('stream-info', handleStreamInfo);
    socket.on('stream-error', handleStreamError);

    return () => {
      socket.off('stream-started', handleStreamStarted);
      socket.off('stream-stopped', handleStreamStopped);
      socket.off('viewer-joined', handleViewerJoined);
      socket.off('viewer-left', handleViewerLeft);
      socket.off('stream-info', handleStreamInfo);
      socket.off('stream-error', handleStreamError);
      
      webrtcService.off('track');
      webrtcService.off('connected');
      webrtcService.off('connection-failed');
      webrtcService.off('error');
    };
  }, [socket, deviceId]);

  const cleanup = useCallback(() => {
    webrtcService.stopStreaming();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsViewing(false);
  }, []);

  const startViewing = useCallback(async () => {
    if (!socket || !roomId) {
      toast.error('Not connected');
      return;
    }

    try {
      await webrtcService.initialize(roomId, false);
      socket.emit('view-stream', { roomId });
      toast.success('Connecting to stream...');
    } catch (error) {
      console.error('Start viewing error:', error);
      toast.error('Failed to start stream viewing');
    }
  }, [socket, roomId]);

  const stopViewing = useCallback(() => {
    if (socket && roomId) {
      socket.emit('stop-viewing', { roomId });
    }
    cleanup();
  }, [socket, roomId, cleanup]);

  const requestStream = useCallback(() => {
    if (socket && roomId) {
      socket.emit('stream-request', { roomId });
    }
  }, [socket, roomId]);

  const changeQuality = useCallback((quality) => {
    if (socket && roomId) {
      socket.emit('stream-quality', { roomId, quality });
      setCurrentQuality(quality);
    }
  }, [socket, roomId]);

  return {
    isStreaming,
    isViewing,
    streamInfo,
    viewerCount,
    error,
    videoRef,
    currentQuality,
    startViewing,
    stopViewing,
    requestStream,
    cleanup,
    changeQuality
  };
};