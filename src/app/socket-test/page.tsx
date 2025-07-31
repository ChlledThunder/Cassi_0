'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocketVercel } from '@/hooks/use-socket-vercel';

export default function SocketTestPage() {
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  const {
    socket,
    isConnected,
    connectionError,
    connectionAttempts,
    connect,
    disconnect,
    reconnect
  } = useSocketVercel({
    onConnect: () => console.log('Socket connected!'),
    onDisconnect: (reason) => console.log('Socket disconnected:', reason),
    onError: (error) => console.log('Socket error:', error)
  });

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleTestResponse = (data: any) => {
      console.log('Test response received:', data);
      setTestResponse(JSON.stringify(data, null, 2));
    };

    const handleRoomCreated = (data: any) => {
      console.log('Room created:', data);
      setRoomId(data.roomId);
      setPlayers(data.players);
    };

    const handleRoomJoined = (data: any) => {
      console.log('Room joined:', data);
      setRoomId(data.roomId);
      setPlayers(data.players);
    };

    const handlePlayerJoined = (data: any) => {
      console.log('Player joined:', data);
      setPlayers(data.players);
    };

    const handleGameStarted = (data: any) => {
      console.log('Game started:', data);
      setGameStarted(true);
      setPlayers(data.players);
    };

    const handleGameEnded = (data: any) => {
      console.log('Game ended:', data);
      setGameStarted(false);
      setPlayers(data.players);
    };

    socket.on('testResponse', handleTestResponse);
    socket.on('roomCreated', handleRoomCreated);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('gameStarted', handleGameStarted);
    socket.on('gameEnded', handleGameEnded);

    return () => {
      socket.off('testResponse', handleTestResponse);
      socket.off('roomCreated', handleRoomCreated);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('gameStarted', handleGameStarted);
      socket.off('gameEnded', handleGameEnded);
    };
  }, [socket]);

  const sendTestMessage = () => {
    if (socket && isConnected && testMessage.trim()) {
      console.log('Sending test message:', testMessage);
      socket.emit('test', { message: testMessage, timestamp: new Date().toISOString() });
    }
  };

  const createRoom = () => {
    if (socket && isConnected && username.trim()) {
      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log('Creating room:', newRoomId);
      socket.emit('createRoom', {
        roomId: newRoomId,
        username: username.trim(),
        maxPlayers: 4
      });
    }
  };

  const joinRoom = () => {
    if (socket && isConnected && username.trim() && roomId.trim()) {
      console.log('Joining room:', roomId);
      socket.emit('joinRoom', {
        roomId: roomId.trim(),
        username: username.trim()
      });
    }
  };

  const startGame = () => {
    if (socket && isConnected && roomId) {
      console.log('Starting game in room:', roomId);
      socket.emit('startGame', { roomId });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Vercel Socket.IO Test
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              {connectionAttempts > 0 && (
                <Badge variant="outline">
                  Attempts: {connectionAttempts}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">Error: {connectionError}</p>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button onClick={connect} disabled={isConnected}>
              Connect
            </Button>
            <Button onClick={disconnect} disabled={!isConnected} variant="outline">
              Disconnect
            </Button>
            <Button onClick={reconnect} variant="outline">
              Reconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message"
              disabled={!isConnected}
            />
            <Button onClick={sendTestMessage} disabled={!isConnected}>
              Send Test
            </Button>
          </div>
          
          {testResponse && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium mb-2">Response:</p>
              <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                {testResponse}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multiplayer Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={!isConnected}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room ID</label>
              <Input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                disabled={!isConnected}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={createRoom} disabled={!isConnected || !username.trim()}>
              Create Room
            </Button>
            <Button onClick={joinRoom} disabled={!isConnected || !username.trim() || !roomId.trim()}>
              Join Room
            </Button>
            <Button onClick={startGame} disabled={!isConnected || !roomId || players.length < 2 || gameStarted}>
              Start Game
            </Button>
          </div>
          
          {players.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium mb-2">Players in Room {roomId}:</p>
              <ul className="space-y-1">
                {players.map((player, index) => (
                  <li key={index} className="text-sm flex items-center space-x-2">
                    <span>{player.username}</span>
                    {player.isHost && <Badge variant="outline">Host</Badge>}
                    {gameStarted && index === 0 && <Badge variant="default">Current Turn</Badge>}
                  </li>
                ))}
              </ul>
              {gameStarted && (
                <p className="text-sm text-green-600 mt-2">Game in progress!</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Socket ID:</strong> {socket?.id || 'N/A'}</p>
            <p><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Base URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
            <p><strong>Connection Attempts:</strong> {connectionAttempts}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}