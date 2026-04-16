import clipboardService from '../services/clipboardService.js';

export default function(socket, io, getRoomId) {
  
  socket.on('clipboard-update', async ({ type, content, roomId: providedRoomId }) => {
  const roomId = providedRoomId || getRoomId();
  if (!roomId) return socket.emit('clipboard-error', { message: 'No active room' });
  
  try {
    // Get existing clipboard to compare before updating
    const existing = await clipboardService.getClipboard(roomId);
    
    const clipboardData = await clipboardService.updateClipboard(
      roomId, 
      type, 
      content, 
      socket.deviceId
    );
    
    // ONLY broadcast if it's truly new content (different ID or timestamp)
    if (!existing || existing.id !== clipboardData.id) {
      socket.to(roomId).emit('clipboard-sync', clipboardData);
      socket.emit('clipboard-updated', { success: true, data: clipboardData });
      // console.log(`[CLIPBOARD HANDLER] New content in room ${roomId} from ${socket.deviceType}`);
    } else {
      // Quietly acknowledge to the sender without broadcasting to everyone
      socket.emit('clipboard-updated', { success: true, data: clipboardData, isDuplicate: true });
    }
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
        // console.log(`[CLIPBOARD HANDLER] Requested by ${socket.deviceType} - sent latest`);
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
      // console.log(`[CLIPBOARD HANDLER] Cleared in room ${roomId}`);
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