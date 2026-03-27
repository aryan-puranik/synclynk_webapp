class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.remoteStream = null;
    this.roomId = null;
    this.state = 'idle'; // idle, connecting, connected, error
    this.stateListeners = new Set();
    this.streamListeners = new Set();
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10,
    };
  }

  setupSocketListeners(socket) {
    if (!socket) return;

    // Handle incoming WebRTC offer from mobile
    socket.on('webrtc-offer', async ({ offer, from }) => {
      console.log('[WebRTC] Received offer from mobile');
      await this.handleOffer(offer);
    });

    // Handle incoming ICE candidates from mobile
    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      console.log('[WebRTC] Received ICE candidate');
      await this.handleIceCandidate(candidate);
    });

    // Handle stream stopped by mobile
    socket.on('stream-stopped', () => {
      console.log('[WebRTC] Stream stopped by mobile');
      this.stopStream();
    });

    // Handle stream started notification
    socket.on('stream-started', ({ streamerId, config }) => {
      console.log('[WebRTC] Stream started by mobile:', streamerId);
      this._setState('connecting');
    });
  }

  async initialize(roomId) {
    this.roomId = roomId;
    this._setState('connecting');
    
    this.peerConnection = new RTCPeerConnection(this.configuration);
    this._setupPeerConnectionListeners();
    
    return this.peerConnection;
  }

  _setupPeerConnectionListeners() {
    if (!this.peerConnection) return;

    // Handle incoming tracks (video/audio)
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Received remote track');
      this.remoteStream = event.streams[0];
      this._notifyStream(this.remoteStream);
      this._setState('connected');
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.roomId && window.socket) {
        window.socket.emit('webrtc-ice-candidate', {
          roomId: this.roomId,
          candidate: event.candidate
        });
        console.log('[WebRTC] Sent ICE candidate');
      }
    };

    // Track connection state
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('[WebRTC] Connection state:', state);
      
      if (state === 'connected') {
        this._setState('connected');
      } else if (state === 'disconnected') {
        this._setState('connecting');
      } else if (state === 'failed') {
        this._setState('error');
        this.stopStream();
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', this.peerConnection.iceConnectionState);
    };
  }

  async handleOffer(offer) {
    if (!this.peerConnection) {
      await this.initialize(this.roomId);
    }

    try {
      // Set remote description (offer from mobile)
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('[WebRTC] Remote description set');

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      // Send answer back to mobile
      if (window.socket && this.roomId) {
        window.socket.emit('webrtc-answer', {
          roomId: this.roomId,
          answer: this.peerConnection.localDescription
        });
        console.log('[WebRTC] Answer sent to mobile');
      }
      
      return answer;
    } catch (error) {
      console.error('[WebRTC] Error handling offer:', error);
      this._setState('error');
      throw error;
    }
  }

  async handleIceCandidate(candidate) {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('[WebRTC] ICE candidate added');
    } catch (error) {
      console.error('[WebRTC] Error adding ICE candidate:', error);
    }
  }

  stopStream() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    
    this._notifyStream(null);
    this._setState('idle');
    console.log('[WebRTC] Stream stopped');
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  // State management
  _setState(newState) {
    this.state = newState;
    this.stateListeners.forEach(fn => fn(newState));
  }

  addStateListener(fn) {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }

  addStreamListener(fn) {
    this.streamListeners.add(fn);
    return () => this.streamListeners.delete(fn);
  }

  _notifyStream(stream) {
    this.streamListeners.forEach(fn => fn(stream));
  }

  getState() {
    return this.state;
  }
}

// Create singleton instance
const webrtcService = new WebRTCService();
export default webrtcService;