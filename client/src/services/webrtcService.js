import socketService from './socketService';

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.roomId = null;
    this.isInitiator = false;
    this.listeners = new Map();
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10,
    };
    
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    socketService.on('webrtc-offer', async ({ offer, from }) => {
      await this.handleOffer(offer);
    });

    socketService.on('webrtc-answer', async ({ answer }) => {
      await this.handleAnswer(answer);
    });

    socketService.on('webrtc-ice-candidate', async ({ candidate }) => {
      await this.handleIceCandidate(candidate);
    });
  }

  async initialize(roomId, isInitiator = false) {
    this.roomId = roomId;
    this.isInitiator = isInitiator;
    
    this.peerConnection = new RTCPeerConnection(this.configuration);
    this.setupPeerConnectionListeners();
    
    return this.peerConnection;
  }

  setupPeerConnectionListeners() {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate(this.roomId, event.candidate);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection.iceConnectionState;
      this.emitEvent('ice-state-change', state);
      
      if (state === 'connected') {
        this.emitEvent('connected');
      } else if (state === 'failed') {
        this.emitEvent('connection-failed');
      } else if (state === 'disconnected') {
        this.emitEvent('disconnected');
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      this.emitEvent('connection-state-change', state);
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.emitEvent('track', this.remoteStream);
    };
  }

  async getLocalStream(constraints = { video: true, audio: true }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
      
      this.emitEvent('local-stream', this.localStream);
      return this.localStream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      this.emitEvent('error', error);
      throw error;
    }
  }

  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      socketService.sendOffer(this.roomId, offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      this.emitEvent('error', error);
      throw error;
    }
  }

  async handleOffer(offer) {
    if (!this.peerConnection) {
      await this.initialize(this.roomId, false);
    }
    
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      socketService.sendAnswer(this.roomId, answer);
      return answer;
    } catch (error) {
      console.error('Error handling offer:', error);
      this.emitEvent('error', error);
      throw error;
    }
  }

  async handleAnswer(answer) {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      this.emitEvent('error', error);
      throw error;
    }
  }

  async handleIceCandidate(candidate) {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      this.emitEvent('error', error);
    }
  }

  async startStreaming(constraints) {
    await this.getLocalStream(constraints);
    if (this.isInitiator) {
      await this.createOffer();
    }
  }

  stopStreaming() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.remoteStream = null;
    this.emitEvent('stopped');
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      this.emitEvent('audio-toggled', enabled);
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      this.emitEvent('video-toggled', enabled);
    }
  }

  getAudioTracks() {
    return this.localStream ? this.localStream.getAudioTracks() : [];
  }

  getVideoTracks() {
    return this.localStream ? this.localStream.getVideoTracks() : [];
  }

  getStats() {
    if (!this.peerConnection) return null;
    
    return this.peerConnection.getStats().then(stats => {
      const result = {
        audio: { bytesSent: 0, bytesReceived: 0, packetsSent: 0, packetsReceived: 0 },
        video: { bytesSent: 0, bytesReceived: 0, packetsSent: 0, packetsReceived: 0 },
        connection: { rtt: null, currentRoundTripTime: null }
      };
      
      stats.forEach(stat => {
        if (stat.type === 'outbound-rtp') {
          if (stat.kind === 'audio') {
            result.audio.bytesSent = stat.bytesSent;
            result.audio.packetsSent = stat.packetsSent;
          } else if (stat.kind === 'video') {
            result.video.bytesSent = stat.bytesSent;
            result.video.packetsSent = stat.packetsSent;
          }
        } else if (stat.type === 'inbound-rtp') {
          if (stat.kind === 'audio') {
            result.audio.bytesReceived = stat.bytesReceived;
            result.audio.packetsReceived = stat.packetsReceived;
          } else if (stat.kind === 'video') {
            result.video.bytesReceived = stat.bytesReceived;
            result.video.packetsReceived = stat.packetsReceived;
          }
        } else if (stat.type === 'candidate-pair' && stat.nominated) {
          result.connection.currentRoundTripTime = stat.currentRoundTripTime;
          result.connection.rtt = stat.currentRoundTripTime * 1000;
        }
      });
      
      return result;
    });
  }

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

  isConnected() {
    return this.peerConnection && this.peerConnection.connectionState === 'connected';
  }
}

// Create and export singleton instance
const webrtcService = new WebRTCService();
export default webrtcService;