import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(serverUrl = null) {
    const url = serverUrl || import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emitEvent('connection-status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emitEvent('connection-status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      this.emitEvent('connection-error', { error, attempts: this.reconnectAttempts });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.emitEvent('reconnected', { attemptNumber });
    });

    this.socket.on('pong', (data) => {
      this.emitEvent('pong', data);
    });
  }

  // Register event listener
  on(event, callback) {
    if (!this.socket) return;
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    this.socket.on(event, callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.socket) return;
    
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      this.socket.off(event, callback);
    }
  }

  // Emit event
  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn(`Cannot emit ${event}: socket not connected`);
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  // Emit event with acknowledgment
  emitWithAck(event, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Acknowledgment timeout'));
      }, timeout);

      this.socket.emit(event, data, (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      });
    });
  }

  // Internal method to emit events to local listeners
  emitEvent(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Register device
  registerDevice(deviceId, deviceType = 'browser') {
    return this.emit('register-device', { deviceId, deviceType });
  }

  // Pair with code
  pairWithCode(pairingCode, deviceId) {
    return this.emit('pair-with-code', { pairingCode, deviceId });
  }

  // Clipboard operations
  updateClipboard(roomId, type, content) {
    return this.emit('clipboard-update', { roomId, type, content });
  }

  requestClipboard(roomId) {
    return this.emit('clipboard-request', { roomId });
  }

  getClipboardHistory(roomId, limit = 20) {
    return this.emit('clipboard-history', { roomId, limit });
  }

  clearClipboard(roomId) {
    return this.emit('clipboard-clear', { roomId });
  }

  // Stream operations
  startStream(roomId, config = {}) {
    return this.emit('start-stream', { roomId, ...config });
  }

  stopStream(roomId) {
    return this.emit('stop-stream', { roomId });
  }

  viewStream(roomId) {
    return this.emit('view-stream', { roomId });
  }

  stopViewing(roomId) {
    return this.emit('stop-viewing', { roomId });
  }

  // WebRTC signaling
  sendOffer(roomId, offer) {
    return this.emit('webrtc-offer', { roomId, offer });
  }

  sendAnswer(roomId, answer) {
    return this.emit('webrtc-answer', { roomId, answer });
  }

  sendIceCandidate(roomId, candidate) {
    return this.emit('webrtc-ice-candidate', { roomId, candidate });
  }

  // Notification operations
  sendNotification(roomId, notification) {
    return this.emit('notification', { roomId, notification });
  }

  updateNotificationSettings(roomId, settings) {
    return this.emit('notification-settings-update', settings);
  }

  getNotificationSettings(roomId) {
    return this.emit('get-notification-settings', { roomId });
  }

  getNotifications(roomId, filters = {}) {
    return this.emit('get-notifications', { roomId, filters });
  }

  markNotificationRead(roomId, notificationId) {
    return this.emit('notification-read', { roomId, notificationId });
  }

  clearNotifications(roomId, app = null) {
    return this.emit('notifications-clear', { roomId, app });
  }

  // Connection management
  ping() {
    return this.emit('ping');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Create and export singleton instance
const socketService = new SocketService();
export default socketService;