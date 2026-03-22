import streamService from '../services/streamService.js';

export default function(socket, io, getRoomId) {
  let isStreamer = false;
  
  socket.on('start-stream', async (streamConfig) => {
    const roomId = getRoomId();
    if (!roomId) {
      socket.emit('stream-error', { message: 'No active room' });
      return;
    }
    
    try {
      const stream = await streamService.startStream(roomId, socket.deviceId, streamConfig);
      if (stream) {
        isStreamer = true;
        socket.to(roomId).emit('stream-started', {
          streamerId: socket.deviceId,
          streamerType: socket.deviceType,
          config: stream.config,
          streamId: stream.id
        });
        socket.emit('stream-ready', { 
          streamId: stream.id,
          config: stream.config
        });
        console.log(`[STREAM] Started in room ${roomId} by ${socket.deviceType}`);
      }
    } catch (error) {
      console.error('[STREAM] Start error:', error);
      socket.emit('stream-error', { message: error.message });
    }
  });
  
  socket.on('stop-stream', async () => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    const stream = await streamService.stopStream(roomId, socket.deviceId);
    if (stream) {
      isStreamer = false;
      socket.to(roomId).emit('stream-stopped', {
        stoppedBy: socket.deviceId,
        duration: stream.endedAt - stream.startedAt
      });
      socket.emit('stream-ended');
      console.log(`[STREAM] Stopped in room ${roomId}`);
    }
  });
  
  socket.on('view-stream', async () => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    const viewerInfo = await streamService.addViewer(roomId, socket.deviceId);
    if (viewerInfo) {
      socket.emit('stream-info', viewerInfo);
      socket.to(roomId).emit('viewer-joined', { 
        viewerId: socket.deviceId,
        viewerType: socket.deviceType,
        totalViewers: viewerInfo.viewerCount
      });
      console.log(`[STREAM] Viewer joined: ${socket.deviceType} (${viewerInfo.viewerCount} total)`);
    } else {
      socket.emit('stream-unavailable');
    }
  });
  
  socket.on('stop-viewing', async () => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    const viewerInfo = await streamService.removeViewer(roomId, socket.deviceId);
    if (viewerInfo) {
      socket.to(roomId).emit('viewer-left', { 
        viewerId: socket.deviceId,
        totalViewers: viewerInfo.viewerCount
      });
      console.log(`[STREAM] Viewer left: ${socket.deviceType} (${viewerInfo.viewerCount} remaining)`);
    }
  });
  
  // WebRTC Signaling with better error handling
  socket.on('webrtc-offer', ({ offer, roomId: providedRoomId }) => {
    const roomId = providedRoomId || getRoomId();
    if (!roomId) {
      socket.emit('webrtc-error', { message: 'No active room' });
      return;
    }
    socket.to(roomId).emit('webrtc-offer', { 
      offer, 
      from: socket.id,
      fromType: socket.deviceType,
      timestamp: Date.now()
    });
    console.log(`[WEBRTC] Offer relayed in room ${roomId}`);
  });
  
  socket.on('webrtc-answer', ({ answer, roomId: providedRoomId }) => {
    const roomId = providedRoomId || getRoomId();
    if (!roomId) return;
    socket.to(roomId).emit('webrtc-answer', { 
      answer, 
      from: socket.id,
      fromType: socket.deviceType,
      timestamp: Date.now()
    });
    console.log(`[WEBRTC] Answer relayed in room ${roomId}`);
  });
  
  socket.on('webrtc-ice-candidate', ({ candidate, roomId: providedRoomId }) => {
    const roomId = providedRoomId || getRoomId();
    if (!roomId) return;
    socket.to(roomId).emit('webrtc-ice-candidate', { 
      candidate, 
      from: socket.id,
      timestamp: Date.now()
    });
  });
  
  socket.on('stream-request', async () => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    const streamInfo = await streamService.getStreamInfo(roomId);
    socket.emit('stream-info-response', streamInfo);
  });
  
  socket.on('stream-quality', async ({ quality, bitrate }) => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    const updatedConfig = await streamService.updateStreamConfig(roomId, socket.deviceId, {
      quality,
      bitrate
    });
    
    if (updatedConfig) {
      socket.to(roomId).emit('stream-quality-updated', updatedConfig);
      socket.emit('stream-quality-confirmed', updatedConfig);
    }
  });
}