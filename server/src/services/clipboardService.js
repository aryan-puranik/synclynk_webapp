import store from '../utils/inMemoryStore.js';

class ClipboardService {
  constructor() {
    this.maxHistorySize = 50;
  }

  async updateClipboard(roomId, type, content, deviceId) {
    try {
      // Validate clipboard data
      const validated = this.validateClipboardData(type, content);
      if (!validated.valid) {
        throw new Error(validated.error);
      }

      // 2. DEDUPLICATION CHECK: Get current clipboard to see if content changed
    const currentClipboard = store.getClipboard(roomId);
    if (currentClipboard && 
        currentClipboard.type === type && 
        currentClipboard.fullContent === content) {
      // console.log(`[CLIPBOARD SERVICE] Ignoring duplicate content for room ${roomId}`);
      return currentClipboard; // Return existing data instead of creating a new one
    }

      // Create clipboard data object
      const clipboardData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        content: type === 'text' ? content : content.substring(0, 100) + '...', // Store preview
        fullContent: content,
        deviceId,
        timestamp: Date.now(),
        size: type === 'text' ? content.length : content.length
      };

      // Store current clipboard
      store.setClipboard(roomId, clipboardData);
      
      // Update history
      
      const history = [...(store.getClipboardHistory(roomId) || [])];
      
      // console.log(`[CLIPBOARD SERVICE] Updated in room ${roomId}: ${type} - ${clipboardData.id}`);

      // Final safety check: Ensure this specific content isn't already the first item
    if (history.length === 0 || history[0].fullContent !== content) {
      history.unshift(clipboardData);
      store.setClipboardHistory(roomId, history.slice(0, this.maxHistorySize));
    }
      
      return clipboardData;
    } catch (error) {
      console.error('[CLIPBOARD SERVICE] Update error:', error);
      throw error;
    }
  }

  validateClipboardData(type, content) {
    if (type === 'text') {
      if (typeof content !== 'string') {
        return { valid: false, error: 'Text content must be a string' };
      }
      if (content.length > 10000) {
        return { valid: false, error: 'Text exceeds maximum length of 10000 characters' };
      }
    } else if (type === 'image') {
      if (!content || !content.startsWith('data:image/')) {
        return { valid: false, error: 'Invalid image format' };
      }
      // Calculate approximate size in bytes (base64)
      const sizeInBytes = (content.length * 3) / 4 - (content.indexOf('base64,') + 7);
      if (sizeInBytes > 5 * 1024 * 1024) { // 5MB limit
        return { valid: false, error: 'Image exceeds maximum size of 5MB' };
      }
    } else {
      return { valid: false, error: 'Invalid clipboard type' };
    }
    
    return { valid: true };
  }

  async getClipboard(roomId) {
    try {
      const clipboard = store.getClipboard(roomId);
      return clipboard || null;
    } catch (error) {
      console.error('[CLIPBOARD SERVICE] Get error:', error);
      return null;
    }
  }

  async getClipboardHistory(roomId, limit = 20) {
    try {
      const history = store.getClipboardHistory(roomId) || [];
      return history.slice(0, limit);
    } catch (error) {
      console.error('[CLIPBOARD SERVICE] Get history error:', error);
      return [];
    }
  }

  async clearClipboard(roomId) {
    try {
      store.clearClipboard(roomId);
      // console.log(`[CLIPBOARD SERVICE] Cleared clipboard for room ${roomId}`);
      return { success: true };
    } catch (error) {
      console.error('[CLIPBOARD SERVICE] Clear error:', error);
      throw error;
    }
  }

  async getClipboardStatus(roomId) {
    try {
      const clipboard = await this.getClipboard(roomId);
      const history = await this.getClipboardHistory(roomId, 1);
      
      return {
        hasContent: !!clipboard,
        lastUpdated: clipboard?.timestamp || null,
        type: clipboard?.type || null,
        historyCount: history.length
      };
    } catch (error) {
      console.error('[CLIPBOARD SERVICE] Status error:', error);
      return { hasContent: false, historyCount: 0 };
    }
  }
}

// Create and export a singleton instance
const clipboardService = new ClipboardService();
export default clipboardService;