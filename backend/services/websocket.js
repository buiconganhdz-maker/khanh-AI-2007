function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join camera room for targeted updates
    socket.on('subscribe-camera', (cameraId) => {
      socket.join(`camera-${cameraId}`);
      console.log(`📹 ${socket.id} subscribed to camera ${cameraId}`);
    });

    socket.on('unsubscribe-camera', (cameraId) => {
      socket.leave(`camera-${cameraId}`);
    });

    // Client requesting latest stats
    socket.on('request-stats', async () => {
      // Stats will be pushed by the alert handler
      socket.emit('stats-request-ack', { status: 'ok' });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  console.log('🔌 WebSocket server initialized');
}

module.exports = { setupWebSocket };
