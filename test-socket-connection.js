const io = require('socket.io-client');

// Test Socket.IO connection
function testSocketConnection() {
  console.log('Testing Socket.IO connection...');
  
  const socket = io('http://localhost:3000', {
    path: '/api/socketio',
    transports: ['polling', 'websocket'],
    timeout: 10000,
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('✅ Connected to Socket.IO server');
    console.log('Socket ID:', socket.id);
    
    // Test message
    socket.emit('test', { message: 'Hello from test script', timestamp: new Date().toISOString() });
  });

  socket.on('testResponse', (data) => {
    console.log('✅ Test response received:', data);
    socket.disconnect();
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected:', reason);
  });

  // Test room creation
  socket.on('connect', () => {
    console.log('Testing room creation...');
    socket.emit('createRoom', {
      roomId: 'TEST123',
      username: 'TestUser',
      maxPlayers: 4
    });
  });

  socket.on('roomCreated', (data) => {
    console.log('✅ Room created:', data);
  });

  socket.on('joinError', (data) => {
    console.log('❌ Join error:', data);
  });

  // Timeout after 15 seconds
  setTimeout(() => {
    if (socket.connected) {
      console.log('⏰ Test timeout, disconnecting...');
      socket.disconnect();
    } else {
      console.log('❌ Test failed - no connection established');
    }
    process.exit(0);
  }, 15000);
}

testSocketConnection();