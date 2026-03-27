// src/sockets/streamHandler.js
import streamService from '../services/streamService.js';

export default function(socket, io, getRoomId) {
  
  // 1. Mobile Initiates: Mobile sends 'start-stream'
  socket.on('start-stream', async (streamConfig) => {
    const roomId = getRoomId();
    if (!roomId) return;
    
    try {
      const stream = await streamService.startStream(roomId, socket.deviceId, streamConfig);
      if (stream) {
        // Notify the web app that the mobile is now broadcasting
        socket.to(roomId).emit('stream-started', {
          streamerId: socket.deviceId,
          config: stream.config
        });
        console.log(`[STREAM] Mobile started broadcast in room ${roomId}`);
      }
    } catch (error) {
      socket.emit('stream-error', { message: error.message });
    }
  });

  // 2. Web Requests: Web sends 'request-mobile-stream' to wake up mobile camera
  socket.on('request-mobile-stream', () => {
    const roomId = getRoomId();
    if (!roomId) return;
    // Relay the request to the mobile device in the room
    socket.to(roomId).emit('request-mobile-stream');
    console.log(`[STREAM] Web app requested stream in room ${roomId}`);
  });

  socket.on('stop-stream', async () => {
    const roomId = getRoomId();
    if (!roomId) return;
    const stream = await streamService.stopStream(roomId, socket.deviceId);
    if (stream) {
      socket.to(roomId).emit('stream-stopped');
      console.log(`[STREAM] Stopped in room ${roomId}`);
    }
  });

  // 3. Signaling Relay: Bidirectional WebRTC Handshake
  socket.on('webrtc-offer', ({ offer, roomId: providedRoomId }) => {
    const roomId = providedRoomId || getRoomId();
    socket.to(roomId).emit('webrtc-offer', { offer, from: socket.id });
  });

  socket.on('webrtc-answer', ({ answer, roomId: providedRoomId }) => {
    const roomId = providedRoomId || getRoomId();
    socket.to(roomId).emit('webrtc-answer', { answer, from: socket.id });
  });

  socket.on('webrtc-ice-candidate', ({ candidate, roomId: providedRoomId }) => {
    const roomId = providedRoomId || getRoomId();
    socket.to(roomId).emit('webrtc-ice-candidate', { candidate, from: socket.id });
  });

  // 4. Viewer Tracking
  socket.on('view-stream', async () => {
    const roomId = getRoomId();
    if (!roomId) return;
    const info = await streamService.addViewer(roomId, socket.deviceId);
    if (info) {
      socket.to(roomId).emit('viewer-count-updated', { count: info.viewerCount });
      socket.emit('stream-info', info);
    }
  });

  socket.on('stop-viewing', async () => {
    const roomId = getRoomId();
    if (!roomId) return;
    const info = await streamService.removeViewer(roomId, socket.deviceId);
    if (info) socket.to(roomId).emit('viewer-count-updated', { count: info.viewerCount });
  });
}