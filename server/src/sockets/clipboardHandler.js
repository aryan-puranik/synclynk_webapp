import clipboardService from '../services/clipboardService.js';

export default function(socket, io, getRoomId) {
  
  socket.on('clipboard-update', async ({ type, content, roomId: providedRoomId }) => {
    const roomId = providedRoomId || getRoomId();
    if (!roomId) {
      socket.emit('clipboard-error', { message: 'No active room' });
      return;
    }
    
    try {
      const clipboardData = await clipboardService.updateClipboard(
        roomId, 
        type, 
        content, 
        socket.deviceId
      );
      
      // Broadcast to all devices in the room except sender
      socket.to(roomId).emit('clipboard-sync', clipboardData);
      
      // Also send back to sender for confirmation
      socket.emit('clipboard-updated', { success: true, data: clipboardData });
      
      console.log(`[CLIPBOARD HANDLER] Updated in room ${roomId} by ${socket.deviceType}`);
    } catch (error) {
      console.error('[CLIPBOARD HANDLER] Update error:', error);
      socket.emit('clipboard-error', { message: error.message });
    }
  });
  
  socket.on('clipboard-request', async ({ roomId: providedRoomId } = {}) => {
    const roomId = providedRoomId || getRoomId();
    if (!roomId) {
      socket.emit('clipboard-error', { message: 'No active room' });
      return;
    }
    
    try {
      const clipboard = await clipboardService.getClipboard(roomId);
      if (clipboard) {
        socket.emit('clipboard-sync', clipboard);
        console.log(`[CLIPBOARD HANDLER] Requested by ${socket.deviceType} - sent latest`);
      } else {
        socket.emit('clipboard-empty');
        console.log(`[CLIPBOARD HANDLER] Requested by ${socket.deviceType} - none available`);
      }
    } catch (error) {
      console.error('[CLIPBOARD HANDLER] Request error:', error);
      socket.emit('clipboard-error', { message: 'Failed to get clipboard' });
    }
  });
  
  socket.on('clipboard-history', async ({ limit = 20, roomId: providedRoomId } = {}) => {
    const roomId = providedRoomId || getRoomId();
    if (!roomId) {
      socket.emit('clipboard-error', { message: 'No active room' });
      return;
    }
    
    try {
      const history = await clipboardService.getClipboardHistory(roomId, limit);
      socket.emit('clipboard-history-response', history);
      console.log(`[CLIPBOARD HANDLER] History sent to ${socket.deviceType} (${history.length} items)`);
    } catch (error) {
      console.error('[CLIPBOARD HANDLER] History error:', error);
      socket.emit('clipboard-error', { message: 'Failed to get history' });
    }
  });
  
  socket.on('clipboard-clear', async ({ roomId: providedRoomId } = {}) => {
    const roomId = providedRoomId || getRoomId();
    if (!roomId) {
      socket.emit('clipboard-error', { message: 'No active room' });
      return;
    }
    
    try {
      await clipboardService.clearClipboard(roomId);
      socket.to(roomId).emit('clipboard-cleared');
      socket.emit('clipboard-cleared');
      console.log(`[CLIPBOARD HANDLER] Cleared in room ${roomId}`);
    } catch (error) {
      console.error('[CLIPBOARD HANDLER] Clear error:', error);
      socket.emit('clipboard-error', { message: 'Failed to clear clipboard' });
    }
  });
  
  socket.on('clipboard-status', async ({ roomId: providedRoomId } = {}) => {
    const roomId = providedRoomId || getRoomId();
    if (!roomId) {
      socket.emit('clipboard-error', { message: 'No active room' });
      return;
    }
    
    try {
      const status = await clipboardService.getClipboardStatus(roomId);
      socket.emit('clipboard-status-response', status);
    } catch (error) {
      console.error('[CLIPBOARD HANDLER] Status error:', error);
      socket.emit('clipboard-error', { message: 'Failed to get status' });
    }
  });
}