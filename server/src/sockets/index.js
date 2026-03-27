import store from '../utils/inMemoryStore.js';
import clipboardHandler from './clipboardHandler.js';
import streamHandler from './streamHandler.js';
import notificationHandler from './notificationHandler.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    let currentDeviceId = null;
    let currentRoomId = null;

    // Device registration
    socket.on('register-device', ({ deviceId, deviceType }) => {
      currentDeviceId = deviceId;
      socket.deviceId = deviceId;
      socket.deviceType = deviceType;
      
      const device = store.updateSocketId(deviceId, socket.id);
      
      if (device && device.roomId) {
        currentRoomId = device.roomId;
        socket.join(device.roomId);
        socket.emit('paired', { roomId: device.roomId });
        console.log(`[REGISTER] ${deviceType} re-joined room ${device.roomId}`);
        
        // Send initial data
        sendInitialData(socket, device.roomId);
      }
      
      console.log(`[REGISTER] ${deviceType} registered: ${deviceId}`);
    });

    // Pairing
    socket.on('pair-with-code', ({ pairingCode, deviceId }) => {
      const roomId = store.pairDevices(pairingCode, deviceId, socket.id);
      
      if (roomId) {
        currentRoomId = roomId;
        currentDeviceId = deviceId;
        socket.join(roomId);
        socket.deviceId = deviceId;
        
        const pairedDevice = store.getPairedDevice(deviceId);
        if (pairedDevice && pairedDevice.socketId) {
          io.to(pairedDevice.socketId).emit('paired', { roomId });
          console.log(`[PAIR] Browser notified of pairing: room ${roomId}`);
        }
        
        socket.emit('paired-success', { roomId });
        console.log(`[PAIR] Mobile paired successfully: room ${roomId}`);
        
        sendInitialData(socket, roomId);
      } else {
        socket.emit('pairing-error', { message: 'Invalid or expired pairing code' });
        console.log(`[PAIR] Failed — invalid code: ${pairingCode}`);
      }
    });

    // Setup feature handlers
    clipboardHandler(socket, io, () => currentRoomId);
    streamHandler(socket, io, () => currentRoomId);
    notificationHandler(socket, io, () => currentRoomId);
    
    // Ping/Pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id} (${socket.deviceType})`);
      
      // Notify peer
      if (socket.deviceId) {
        const pairedDevice = store.getPairedDevice(socket.deviceId);
        if (pairedDevice && pairedDevice.socketId) {
          io.to(pairedDevice.socketId).emit('peer-disconnected', {
            deviceId: socket.deviceId,
            deviceType: socket.deviceType,
            timestamp: Date.now()
          });
        }
        
        const device = store.getPairedDevice(socket.deviceId);
        if (device) {
          device.socketId = null;
          device.lastSeen = Date.now();
          device.isConnected = false;
        }
      }
    });
  });
  
  async function sendInitialData(socket, roomId) {
    if (!roomId) return;
    
    // Send clipboard data if exists
    const clipboard = store.getClipboard(roomId);
    if (clipboard) {
      socket.emit('clipboard-sync', clipboard);
      console.log(`[INIT] Sent clipboard data to ${socket.id}`);
    }
    
    // Send stream info
    const stream = store.getStream(roomId);
    if (stream && stream.status === 'active') {
      socket.emit('stream-info', {
        isActive: true,
        viewerCount: stream.viewers ? stream.viewers.size : 0,
        startedAt: stream.startedAt,
        config: stream.config
      });
    }
    
    // Send notification settings
    const notificationSettings = store.getNotificationSettings(roomId);
    if (notificationSettings) {
      socket.emit('notification-settings', notificationSettings);
    }
    
    // Send recent notifications
    const notifications = store.getNotificationHistory(roomId);
    if (notifications && notifications.length > 0) {
      socket.emit('notifications-history', notifications.slice(0, 20));
    }
  }
}