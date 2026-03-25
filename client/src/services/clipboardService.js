import socketService from './socketService';
import storageService from './storageService';

class ClipboardService {
  constructor() {
    this.clipboardData = null;
    this.clipboardHistory = [];
    this.listeners = new Map();
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    // Listen for clipboard sync events
    socketService.on('clipboard-sync', (data) => {
      console.log('Received clipboard-sync:', data); //for debugging
      this.clipboardData = data;
      this.addToHistory(data);
      this.emitEvent('sync', data);
    });

    socketService.on('clipboard-updated', ({ success, data }) => {
    console.log('✅ Received clipboard-updated event:', { success, data });
    if (success) {
      this.clipboardData = data;
      this.addToHistory(data);
      this.emitEvent('sync', data); // Emit sync event for consistency
      this.emitEvent('updated', data);
    }
  });

    socketService.on('clipboard-error', ({ message }) => {
      this.emitEvent('error', { message });
    });

    socketService.on('clipboard-empty', () => {
      this.emitEvent('empty');
    });

    socketService.on('clipboard-cleared', () => {
      this.clipboardData = null;
      this.emitEvent('cleared');
    });

    socketService.on('clipboard-history-response', (history) => {
      this.clipboardHistory = history;
      this.emitEvent('history', history);
    });
  }

  addToHistory(data) {
    // Add to history, keep last 50 items
    this.clipboardHistory = [data, ...this.clipboardHistory].slice(0, 50);

    // Save to local storage
    storageService.setItem('clipboardHistory', this.clipboardHistory.slice(0, 20));
  }

  // Update clipboard (send to server)
  async updateClipboard(roomId, type, content) {
    if (!roomId) {
      throw new Error('No active room');
    }

    socketService.updateClipboard(roomId, type, content);
    return true;
  }

  // Request latest clipboard from server
  async requestClipboard(roomId) {
    if (!roomId) {
      throw new Error('No active room');
    }

    socketService.requestClipboard(roomId);
  }

  // Get clipboard history
  async getHistory(roomId, limit = 20) {
    if (!roomId) {
      throw new Error('No active room');
    }

    socketService.getClipboardHistory(roomId, limit);
  }

  // Clear clipboard
  async clearClipboard(roomId) {
    if (!roomId) {
      throw new Error('No active room');
    }

    socketService.clearClipboard(roomId);
  }

  // Get current clipboard data
  getCurrentClipboard() {
    return this.clipboardData;
  }

  // Get clipboard history
  getHistoryList() {
    return this.clipboardHistory;
  }

  // Copy text to system clipboard
  async copyToSystemClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to system clipboard:', error);
      return false;
    }
  }

  // Read from system clipboard
  async readFromSystemClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      return text || '';
    } catch (error) {
      console.error('Failed to read from system clipboard:', error);
      return null;
    }
  }

  // Check if clipboard permission is granted
  async checkPermission() {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'clipboard-read' });
      return permissionStatus.state === 'granted';
    } catch (error) {
      return false;
    }
  }

  // Request clipboard permission
  async requestPermission() {
    try {
      await navigator.clipboard.readText();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Event handling
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emitEvent(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Load cached history from storage
  loadCachedHistory() {
    const cached = storageService.getItem('clipboardHistory');
    if (cached) {
      this.clipboardHistory = cached;
      this.emitEvent('history', this.clipboardHistory);
    }
  }
}

// Create and export singleton instance
const clipboardService = new ClipboardService();
export default clipboardService;