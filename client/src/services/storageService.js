class StorageService {
  constructor() {
    this.prefix = 'synclynk_';
    this.memoryStorage = new Map();
    this.useLocalStorage = true;
  }

  // Set item
  setItem(key, value, useSession = false) {
    const fullKey = this.prefix + key;
    const stringValue = JSON.stringify(value);
    
    if (useSession) {
      sessionStorage.setItem(fullKey, stringValue);
    } else if (this.useLocalStorage) {
      localStorage.setItem(fullKey, stringValue);
    } else {
      this.memoryStorage.set(fullKey, stringValue);
    }
    
    return true;
  }

  // Get item
  getItem(key, useSession = false) {
    const fullKey = this.prefix + key;
    let value = null;
    
    if (useSession) {
      value = sessionStorage.getItem(fullKey);
    } else if (this.useLocalStorage) {
      value = localStorage.getItem(fullKey);
    } else {
      value = this.memoryStorage.get(fullKey);
    }
    
    if (value) {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    }
    
    return null;
  }

  // Remove item
  removeItem(key, useSession = false) {
    const fullKey = this.prefix + key;
    
    if (useSession) {
      sessionStorage.removeItem(fullKey);
    } else if (this.useLocalStorage) {
      localStorage.removeItem(fullKey);
    } else {
      this.memoryStorage.delete(fullKey);
    }
  }

  // Clear all items with prefix
  clear() {
    const keys = this.getAllKeys();
    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      this.memoryStorage.delete(key);
    });
  }

  // Get all keys with prefix
  getAllKeys() {
    const keys = [];
    
    // Local storage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    
    // Session storage keys
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.prefix) && !keys.includes(key)) {
        keys.push(key);
      }
    }
    
    // Memory storage keys
    for (const key of this.memoryStorage.keys()) {
      if (!keys.includes(key)) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  // Get storage size
  getSize() {
    let total = 0;
    const keys = this.getAllKeys();
    
    keys.forEach(key => {
      const value = localStorage.getItem(key) || sessionStorage.getItem(key) || this.memoryStorage.get(key);
      if (value) {
        total += value.length;
      }
    });
    
    return {
      bytes: total,
      kilobytes: (total / 1024).toFixed(2),
      items: keys.length
    };
  }

  // Check if storage is available
  isStorageAvailable(type = 'localStorage') {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Device storage
  setDeviceId(deviceId) {
    return this.setItem('deviceId', deviceId);
  }

  getDeviceId() {
    return this.getItem('deviceId');
  }

  setRoomId(roomId) {
    return this.setItem('roomId', roomId);
  }

  getRoomId() {
    return this.getItem('roomId');
  }

  setPairingCode(code) {
    return this.setItem('pairingCode', code);
  }

  getPairingCode() {
    return this.getItem('pairingCode');
  }

  // Theme storage
  setTheme(theme) {
    return this.setItem('theme', theme);
  }

  getTheme() {
    return this.getItem('theme');
  }

  // Settings storage
  setSettings(settings) {
    return this.setItem('settings', settings);
  }

  getSettings() {
    return this.getItem('settings') || {};
  }

  updateSettings(updates) {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    this.setSettings(updated);
    return updated;
  }

  // Clear all app data
  clearAppData() {
    this.clear();
    return true;
  }
}

// Create and export singleton instance
const storageService = new StorageService();
export default storageService;