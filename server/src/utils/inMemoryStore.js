class InMemoryStore {
  constructor() {
    this.pairedDevices = new Map(); // deviceId -> { socketId, pairedWith, lastSeen }
    this.pendingPairs = new Map(); // pairingCode -> { deviceId, timestamp }
    this.clipboardData = new Map(); // roomId -> { type, content, timestamp }
    this.activeStreams = new Map(); // roomId -> { streamerId, viewers }
    this.notificationSettings = new Map(); // roomId -> { apps: ['whatsapp', 'telegram', 'signal'] }
    
    // Cleanup old data every hour
    setInterval(() => this.cleanup(), 3600000);
  }

  generatePairingCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  createPendingPair(deviceId) {
    const pairingCode = this.generatePairingCode();
    this.pendingPairs.set(pairingCode, {
      deviceId,
      timestamp: Date.now()
    });
    
    // Auto cleanup after 5 minutes
    setTimeout(() => {
      this.pendingPairs.delete(pairingCode);
    }, 300000);
    
    return pairingCode;
  }

  pairDevices(pairingCode, deviceId, socketId) {
    const pending = this.pendingPairs.get(pairingCode);
    if (!pending || pending.deviceId === deviceId) return null;
    
    const roomId = `${pending.deviceId}-${deviceId}`;
    
    this.pairedDevices.set(pending.deviceId, {
      socketId: null,
      pairedWith: deviceId,
      roomId,
      lastSeen: Date.now()
    });
    
    this.pairedDevices.set(deviceId, {
      socketId,
      pairedWith: pending.deviceId,
      roomId,
      lastSeen: Date.now()
    });
    
    this.pendingPairs.delete(pairingCode);
    
    return roomId;
  }

  updateSocketId(deviceId, socketId) {
    const device = this.pairedDevices.get(deviceId);
    if (device) {
      device.socketId = socketId;
      device.lastSeen = Date.now();
      this.pairedDevices.set(deviceId, device);
    }
    return device;
  }

  getPairedDevice(deviceId) {
    return this.pairedDevices.get(deviceId);
  }

  setClipboard(roomId, type, content) {
    this.clipboardData.set(roomId, {
      type,
      content,
      timestamp: Date.now()
    });
  }

  getClipboard(roomId) {
    return this.clipboardData.get(roomId);
  }

  setStream(roomId, streamerId) {
    this.activeStreams.set(roomId, {
      streamerId,
      viewers: new Set(),
      timestamp: Date.now()
    });
  }

  addViewer(roomId, viewerId) {
    const stream = this.activeStreams.get(roomId);
    if (stream) {
      stream.viewers.add(viewerId);
      return true;
    }
    return false;
  }

  removeViewer(roomId, viewerId) {
    const stream = this.activeStreams.get(roomId);
    if (stream) {
      stream.viewers.delete(viewerId);
      if (stream.viewers.size === 0) {
        this.activeStreams.delete(roomId);
      }
      return true;
    }
    return false;
  }

  getStream(roomId) {
    return this.activeStreams.get(roomId);
  }

  setNotificationSettings(roomId, apps) {
    this.notificationSettings.set(roomId, apps);
  }

  getNotificationSettings(roomId) {
    return this.notificationSettings.get(roomId) || ['whatsapp', 'telegram', 'signal'];
  }

  cleanup() {
    const now = Date.now();
    const fiveMinutesAgo = now - 300000;
    const oneHourAgo = now - 3600000;
    
    // Cleanup old pending pairs
    for (const [code, data] of this.pendingPairs) {
      if (data.timestamp < fiveMinutesAgo) {
        this.pendingPairs.delete(code);
      }
    }
    
    // Cleanup inactive devices
    for (const [deviceId, data] of this.pairedDevices) {
      if (data.lastSeen < oneHourAgo) {
        this.pairedDevices.delete(deviceId);
      }
    }
    
    // Cleanup old clipboard data
    for (const [roomId, data] of this.clipboardData) {
      if (data.timestamp < oneHourAgo) {
        this.clipboardData.delete(roomId);
      }
    }
  }
}

export default new InMemoryStore();