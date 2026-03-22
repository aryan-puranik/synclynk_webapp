class InMemoryStore {
  constructor() {
    this.pairedDevices = new Map();
    this.pendingPairs = new Map();
    this.clipboardData = new Map();      // roomId -> clipboard object
    this.clipboardHistory = new Map();    // roomId -> array of clipboard items
    this.activeStreams = new Map();
    this.notificationSettings = new Map();
    this.notificationHistory = new Map();
    this.delayedNotifications = new Map();
    
    // Cleanup old data every hour
    setInterval(() => this.cleanup(), 3600000);
  }

  // Clipboard methods
  setClipboard(roomId, data) {
    this.clipboardData.set(roomId, data);
  }

  getClipboard(roomId) {
    return this.clipboardData.get(roomId);
  }

  clearClipboard(roomId) {
    this.clipboardData.delete(roomId);
  }

  setClipboardHistory(roomId, history) {
    this.clipboardHistory.set(roomId, history);
  }

  getClipboardHistory(roomId) {
    return this.clipboardHistory.get(roomId) || [];
  }

  // Device methods
  generatePairingCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  createPendingPair(deviceId) {
    const pairingCode = this.generatePairingCode();
    this.pendingPairs.set(pairingCode, {
      deviceId,
      timestamp: Date.now()
    });
    
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
      lastSeen: Date.now(),
      isConnected: false,
      deviceType: 'browser'
    });
    
    this.pairedDevices.set(deviceId, {
      socketId,
      pairedWith: pending.deviceId,
      roomId,
      lastSeen: Date.now(),
      isConnected: true,
      deviceType: 'mobile'
    });
    
    this.pendingPairs.delete(pairingCode);
    
    return roomId;
  }

  updateSocketId(deviceId, socketId) {
    const device = this.pairedDevices.get(deviceId);
    if (device) {
      device.socketId = socketId;
      device.lastSeen = Date.now();
      device.isConnected = true;
      this.pairedDevices.set(deviceId, device);
    }
    return device;
  }

  getPairedDevice(deviceId) {
    return this.pairedDevices.get(deviceId);
  }

  getDeviceById(deviceId) {
    return this.pairedDevices.get(deviceId);
  }

  getDevicesInRoom(roomId) {
    const devices = [];
    for (const [deviceId, device] of this.pairedDevices) {
      if (device.roomId === roomId) {
        devices.push({
          deviceId,
          deviceType: device.deviceType,
          isConnected: !!device.socketId,
          lastSeen: device.lastSeen
        });
      }
    }
    return devices;
  }

  // Stream methods
  setStream(roomId, streamerId) {
    this.activeStreams.set(roomId, {
      streamerId,
      viewers: new Set(),
      startedAt: Date.now(),
      status: 'active',
      config: { quality: '720p', audio: true, bitrate: 2500 }
    });
  }

  getStream(roomId) {
    return this.activeStreams.get(roomId);
  }

  removeStream(roomId) {
    this.activeStreams.delete(roomId);
  }

  // Notification methods
  setNotificationSettings(roomId, settings) {
    this.notificationSettings.set(roomId, settings);
  }

  getNotificationSettings(roomId) {
    return this.notificationSettings.get(roomId);
  }

  setNotificationHistory(roomId, history) {
    this.notificationHistory.set(roomId, history);
  }

  getNotificationHistory(roomId) {
    return this.notificationHistory.get(roomId) || [];
  }

  setDelayedNotifications(roomId, delayed) {
    this.delayedNotifications.set(roomId, delayed);
  }

  getDelayedNotifications(roomId) {
    return this.delayedNotifications.get(roomId) || [];
  }

  // Cleanup
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
      if (data.lastSeen < oneHourAgo && !data.socketId) {
        this.pairedDevices.delete(deviceId);
      }
    }
    
    // Cleanup old clipboard data
    for (const [roomId, data] of this.clipboardData) {
      if (data.timestamp < oneHourAgo) {
        this.clipboardData.delete(roomId);
      }
    }
    
    // Cleanup old clipboard history
    for (const [roomId, history] of this.clipboardHistory) {
      const filtered = history.filter(item => item.timestamp > oneHourAgo);
      if (filtered.length !== history.length) {
        this.clipboardHistory.set(roomId, filtered);
      }
    }
    
    // Cleanup old notification history
    for (const [roomId, history] of this.notificationHistory) {
      const filtered = history.filter(n => n.timestamp > oneHourAgo);
      if (filtered.length !== history.length) {
        this.notificationHistory.set(roomId, filtered);
      }
    }
    
    console.log('[CLEANUP] Removed expired data');
  }
}

// Export singleton instance
export default new InMemoryStore();