import { useEffect, useState, useRef, useCallback, useContext } from 'react';
import { PairingContext } from '../context/PairingContext';

export function useWebRTC() {
  const { socket, roomId } = useContext(PairingContext);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [incomingOffer, setIncomingOffer] = useState(null);
  
  const videoRef = useRef(null);
  const pcRef = useRef(null);

  const cleanup = useCallback(() => {
    if (pcRef.current) pcRef.current.close();
    setRemoteStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsViewing(false);
    setIsConnecting(false);
  }, []);

  const startViewing = useCallback(async () => {
    if (!incomingOffer || !socket) return;
    setIsConnecting(true);
    try {
      pcRef.current = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (videoRef.current) videoRef.current.srcObject = event.streams[0];
        setIsViewing(true);
        setIsConnecting(false);
      };
      pcRef.current.onicecandidate = (event) => {
        if (event.candidate) socket.emit('webrtc-ice-candidate', { roomId, candidate: event.candidate });
      };

      await pcRef.current.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('webrtc-answer', { roomId, answer });
    } catch (err) {
      setHasError(true);
      cleanup();
    }
  }, [incomingOffer, socket, roomId, cleanup]);

  useEffect(() => {
    if (!socket) return;
    socket.on('webrtc-offer', (data) => setIncomingOffer(data.offer));
    socket.on('webrtc-ice-candidate', (data) => {
      pcRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
    });
    socket.on('stream-stopped', cleanup);
    return () => { cleanup(); };
  }, [socket, cleanup]);

  return { remoteStream, isViewing, isStreaming: !!remoteStream, isConnecting, hasError, videoRef, startViewing, stopViewing: cleanup, requestStream: () => socket?.emit('request-mobile-stream', { roomId }) };
}