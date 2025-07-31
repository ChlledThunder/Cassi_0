import { Server } from 'socket.io';

// Room data structure
interface Room {
  id: string;
  players: Array<{
    id: string;
    username: string;
    isHost: boolean;
    socketId: string;
  }>;
  maxPlayers: number;
  gameStarted: boolean;
  currentPlayer: number;
}

// For Vercel, we need to use a different approach since serverless functions don't maintain state
// We'll use the server instance attached to the response object
export const initializeVercelSocketServer = (server: any) => {
  // Check if Socket.IO is already initialized on this server instance
  if (server.io) {
    return server.io;
  }

  const io = new Server(server, {
    path: '/api/socketio',
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['polling', 'websocket'],
    // Vercel-specific settings
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6,
    allowEIO3: true
  });

  // Store room data on the server instance
  if (!server.rooms) {
    server.rooms = new Map<string, Room>();
  }

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle room creation
    socket.on('createRoom', (data: { roomId: string; username: string; maxPlayers: number }) => {
      const { roomId, username, maxPlayers } = data;
      
      // Create new room
      const room: Room = {
        id: roomId,
        players: [{
          id: 'host-' + Date.now(),
          username,
          isHost: true,
          socketId: socket.id
        }],
        maxPlayers,
        gameStarted: false,
        currentPlayer: 0
      };
      
      server.rooms.set(roomId, room);
      socket.join(roomId);
      
      // Notify client of successful room creation
      socket.emit('roomCreated', { roomId, players: room.players });
      
      console.log(`Room ${roomId} created by ${username}`);
    });
    
    // Handle room joining
    socket.on('joinRoom', (data: { roomId: string; username: string }) => {
      const { roomId, username } = data;
      const room = server.rooms.get(roomId);
      
      if (!room) {
        socket.emit('joinError', { message: 'Room not found' });
        return;
      }
      
      if (room.players.length >= room.maxPlayers) {
        socket.emit('joinError', { message: 'Room is full' });
        return;
      }
      
      if (room.gameStarted) {
        socket.emit('joinError', { message: 'Game already started' });
        return;
      }
      
      // Add player to room
      const newPlayer = {
        id: 'player-' + Date.now(),
        username,
        isHost: false,
        socketId: socket.id
      };
      
      room.players.push(newPlayer);
      socket.join(roomId);
      
      // Notify all players in the room about the new player
      io.to(roomId).emit('playerJoined', { players: room.players });
      
      // Notify the joining player that they successfully joined
      socket.emit('roomJoined', { roomId, players: room.players });
      
      console.log(`${username} joined room ${roomId}`);
    });
    
    // Handle game start
    socket.on('startGame', (data: { roomId: string }) => {
      const { roomId } = data;
      const room = server.rooms.get(roomId);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      
      // Only host can start the game
      const hostPlayer = room.players.find(p => p.isHost && p.socketId === socket.id);
      if (!hostPlayer) {
        socket.emit('error', { message: 'Only host can start the game' });
        return;
      }
      
      if (room.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }
      
      room.gameStarted = true;
      room.currentPlayer = 0;
      
      // Notify all players that game started
      io.to(roomId).emit('gameStarted', { 
        players: room.players, 
        currentPlayer: room.currentPlayer 
      });
      
      console.log(`Game started in room ${roomId}`);
    });
    
    // Handle next player turn
    socket.on('nextPlayer', (data: { roomId: string }) => {
      const { roomId } = data;
      const room = server.rooms.get(roomId);
      
      if (!room || !room.gameStarted) {
        return;
      }
      
      // Move to next player
      room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
      
      // If we're back to the first player, end the game
      if (room.currentPlayer === 0) {
        room.gameStarted = false;
        io.to(roomId).emit('gameEnded', { players: room.players });
      } else {
        // Notify all players about the turn change
        io.to(roomId).emit('playerTurnChanged', { 
          currentPlayer: room.currentPlayer,
          players: room.players
        });
      }
    });
    
    // Handle test connection
    socket.on('test', (data) => {
      console.log('Test message received:', data);
      socket.emit('testResponse', { message: 'Test successful', received: data });
    });
    
    // Handle player disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Find and remove player from all rooms
      for (const [roomId, room] of server.rooms.entries()) {
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex !== -1) {
          const disconnectedPlayer = room.players[playerIndex];
          room.players.splice(playerIndex, 1);
          
          // If host disconnected, assign host to next player
          if (disconnectedPlayer.isHost && room.players.length > 0) {
            room.players[0].isHost = true;
          }
          
          // Notify remaining players
          if (room.players.length > 0) {
            io.to(roomId).emit('playerLeft', { 
              players: room.players,
              message: `${disconnectedPlayer.username} left the room`
            });
          } else {
            // Remove empty room
            server.rooms.delete(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
          }
          
          break;
        }
      }
    });
  });

  server.io = io;
  return io;
};