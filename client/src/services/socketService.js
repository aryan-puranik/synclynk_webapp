import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map(); // Stores local callbacks for React hooks
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initializes the socket connection with the server.
   * Uses environment variables for the URL with a local fallback.
   */
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

  /**
   * Maps native socket.io events to internal 'emitEvent' calls to notify React components.
   */
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

    // Custom Synclynk pairing event
    this.socket.on('paired', (data) => {
      this.emitEvent('paired', data);
    });

    this.socket.on('pong', (data) => {
      this.emitEvent('pong', data);
    });
  }

  // ─── EVENT SYSTEM ──────────────────────────────────────────────────────────

  // Register local listener
  on(event, callback) {
    if (!this.socket) return;
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    this.socket.on(event, callback);
  }

  // Remove local listener
  off(event, callback) {
    if (!this.socket) return;
    
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      this.socket.off(event, callback);
    }
  }

  // Generic emit with connection check
  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn(`Cannot emit ${event}: socket not connected`);
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }

  // Emit with a Promise-based acknowledgment
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

  // Notifies internal service listeners without sending to server
  emitEvent(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // ─── DEVICE & PAIRING ──────────────────────────────────────────────────────

  registerDevice(deviceId, deviceType = 'browser') {
    return this.emit('register-device', { deviceId, deviceType });
  }

  pairWithCode(pairingCode, deviceId) {
    return this.emit('pair-with-code', { pairingCode, deviceId });
  }

  // ─── CLIPBOARD FEATURES ───────────────────────────────────────────────────

  updateClipboard(roomId, type, content) {
    console.log('📤 Syncing clipboard:', { roomId, type, content: content.substring(0, 50) });
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

  // ─── STREAM FEATURES ──────────────────────────────────────────────────────

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

  // WebRTC signaling for camera mirroring
  sendOffer(roomId, offer) {
    return this.emit('webrtc-offer', { roomId, offer });
  }

  sendAnswer(roomId, answer) {
    return this.emit('webrtc-answer', { roomId, answer });
  }

  sendIceCandidate(roomId, candidate) {
    return this.emit('webrtc-ice-candidate', { roomId, candidate });
  }

  // ─── NOTIFICATION FEATURES ────────────────────────────────────────────────

  /**
   * Sends notification to peer. Payload uses 'body' to match native app.
   */
  sendNotification(roomId, notification) {
    return this.emit('notification', { roomId, notification });
  }

  updateNotificationSettings(roomId, settings) {
    // Note: Server handler uses roomId from internal session, but we pass settings object
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

  // ─── CONNECTION MANAGEMENT ────────────────────────────────────────────────

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

const socketService = new SocketService();
export default socketService;