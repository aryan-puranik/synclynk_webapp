import store from '../utils/inMemoryStore.js';

class StreamService {
  constructor() {
    this.streams = new Map();
  }

  async startStream(roomId, streamerId, streamConfig = {}) {
    try {
      const existingStream = store.getStream(roomId);
      if (existingStream) {
        throw new Error('Stream already active in this room');
      }

      const stream = {
        id: `${roomId}-${Date.now()}`,
        roomId,
        streamerId,
        startedAt: Date.now(),
        viewers: new Set(),
        config: {
          quality: streamConfig.quality || '720p',
          audio: streamConfig.audio !== false,
          bitrate: streamConfig.bitrate || 2500,
          ...streamConfig
        },
        status: 'active'
      };

      store.setStream(roomId, stream);
      this.streams.set(stream.id, stream);
      
      return stream;
    } catch (error) {
      console.error('Start stream error:', error);
      throw error;
    }
  }

  async stopStream(roomId, streamerId) {
    const stream = store.getStream(roomId);
    if (stream && stream.streamerId === streamerId) {
      stream.status = 'ended';
      stream.endedAt = Date.now();
      store.removeStream(roomId);
      this.streams.delete(stream.id);
      return stream;
    }
    return null;
  }

  async addViewer(roomId, viewerId) {
    const stream = store.getStream(roomId);
    if (stream && stream.status === 'active') {
      stream.viewers.add(viewerId);
      return {
        viewerCount: stream.viewers.size,
        streamConfig: stream.config
      };
    }
    return null;
  }

  async removeViewer(roomId, viewerId) {
    const stream = store.getStream(roomId);
    if (stream) {
      stream.viewers.delete(viewerId);
      return { viewerCount: stream.viewers.size };
    }
    return null;
  }

  async getStreamInfo(roomId) {
    const stream = store.getStream(roomId);
    if (stream) {
      return {
        isActive: stream.status === 'active',
        viewerCount: stream.viewers.size,
        startedAt: stream.startedAt,
        config: stream.config
      };
    }
    return { isActive: false, viewerCount: 0 };
  }

  async updateStreamConfig(roomId, streamerId, config) {
    const stream = store.getStream(roomId);
    if (stream && stream.streamerId === streamerId) {
      stream.config = { ...stream.config, ...config };
      return stream.config;
    }
    return null;
  }
}

export default new StreamService();