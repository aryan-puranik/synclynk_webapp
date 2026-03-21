import store from '../utils/inMemoryStore.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // ─── DEVICE REGISTRATION ──────────────────────────────────────────────────
    // Called by BOTH the webapp (on page load) and the React Native app
    // (right after socket connects, before pairing)
    socket.on('register-device', ({ deviceId, deviceType }) => {
      const device = store.updateSocketId(deviceId, socket.id);
      socket.deviceId = deviceId;
      socket.deviceType = deviceType; // 'browser' | 'mobile'

      if (device && device.roomId) {
        socket.join(device.roomId);
        socket.emit('paired', { roomId: device.roomId });
        console.log(`[REGISTER] ${deviceType} re-joined room ${device.roomId}`);
      }

      console.log(`[REGISTER] ${deviceType} registered: ${deviceId}`);
    });

    // ─── PAIRING ──────────────────────────────────────────────────────────────
    // React Native app emits this after scanning the QR code.
    // pairingCode = the code shown as QR on the webapp.
    // deviceId    = a unique ID stored locally on the phone (e.g. via AsyncStorage).
    socket.on('pair-with-code', ({ pairingCode, deviceId }) => {
      const roomId = store.pairDevices(pairingCode, deviceId, socket.id);

      if (roomId) {
        socket.join(roomId);
        socket.deviceId = deviceId;

        // Notify the browser (the device that generated the pairing code)
        const pairedDevice = store.getPairedDevice(deviceId);
        if (pairedDevice && pairedDevice.socketId) {
          io.to(pairedDevice.socketId).emit('paired', { roomId });
          console.log(`[PAIR] Browser notified of pairing: room ${roomId}`);
        }

        // Confirm to the phone
        socket.emit('paired-success', { roomId });
        console.log(`[PAIR] Mobile paired successfully: room ${roomId}`);
      } else {
        socket.emit('pairing-error', { message: 'Invalid or expired pairing code' });
        console.log(`[PAIR] Failed — invalid code: ${pairingCode}`);
      }
    });

    // ─── UNIVERSAL CLIPBOARD ──────────────────────────────────────────────────
    // Either device can send a clipboard update — relayed to the other.
    // type: 'text' | 'image' (future)
    socket.on('clipboard-update', ({ roomId, type, content }) => {
      store.setClipboard(roomId, type, content);
      // socket.to() sends to everyone in the room EXCEPT the sender
      socket.to(roomId).emit('clipboard-sync', { type, content });
      console.log(`[CLIPBOARD] Updated in room ${roomId}: ${String(content).slice(0, 40)}…`);
    });

    // Phone/browser can request the latest clipboard on connect
    socket.on('clipboard-request', ({ roomId }) => {
      const clipboard = store.getClipboard(roomId);
      if (clipboard) {
        socket.emit('clipboard-sync', clipboard);
      }
    });

    // ─── WEBRTC SIGNALLING ────────────────────────────────────────────────────
    // Server is a pure relay — video/audio never touches the server.

    socket.on('start-stream', ({ roomId }) => {
      store.setStream(roomId, socket.deviceId);
      socket.to(roomId).emit('stream-started');
      console.log(`[STREAM] Started in room ${roomId} by ${socket.deviceId}`);
    });

    socket.on('stop-stream', ({ roomId }) => {
      socket.to(roomId).emit('stream-stopped');
      console.log(`[STREAM] Stopped in room ${roomId}`);
    });

    socket.on('webrtc-offer', ({ roomId, offer }) => {
      socket.to(roomId).emit('webrtc-offer', { offer, from: socket.id });
    });

    socket.on('webrtc-answer', ({ roomId, answer }) => {
      socket.to(roomId).emit('webrtc-answer', { answer, from: socket.id });
    });

    socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('webrtc-ice-candidate', { candidate, from: socket.id });
    });

    // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
    // Browser sets which apps it wants to receive notifications from.
    socket.on('notification-settings', ({ roomId, apps }) => {
      store.setNotificationSettings(roomId, apps);
      console.log(`[NOTIF] Settings updated for room ${roomId}:`, apps);
    });

    // Phone sends a notification — server filters by settings then relays.
    socket.on('notification', ({ roomId, notification }) => {
      const settings = store.getNotificationSettings(roomId);
      // If settings is empty array, allow all notifications through
      if (!settings.length || settings.includes(notification.app)) {
        socket.to(roomId).emit('notification', notification);
        console.log(`[NOTIF] ${notification.app}: ${notification.title}`);
      }
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id} (${socket.deviceType})`);

      // Stop any active stream this device was running
      for (const [roomId, stream] of store.activeStreams) {
        if (stream.streamerId === socket.deviceId) {
          io.to(roomId).emit('stream-stopped');
          console.log(`[STREAM] Auto-stopped on disconnect for room ${roomId}`);
          break;
        }
      }

      // FIX: Notify the peer device that this device disconnected
      // (original code didn't do this — peer had no way to know)
      if (socket.deviceId) {
        const pairedDevice = store.getPairedDevice(socket.deviceId);
        if (pairedDevice && pairedDevice.socketId) {
          io.to(pairedDevice.socketId).emit('peer-disconnected', {
            deviceType: socket.deviceType,
          });
        }

        // Null out the socket ID so the device shows as offline
        const device = store.getDeviceById?.(socket.deviceId);
        if (device) {
          device.socketId = null;
        }
      }
    });
  });
}