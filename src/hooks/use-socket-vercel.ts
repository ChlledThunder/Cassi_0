import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketVercelOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

export const useSocketVercel = (options: UseSocketVercelOptions = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    const {
      autoConnect = true,
      onConnect,
      onDisconnect,
      onError
    } = options;

    // Determine the base URL for Socket.IO connection
    const getBaseUrl = () => {
      if (typeof window !== 'undefined') {
        // Client-side
        if (process.env.NODE_ENV === 'production') {
          // In production, use the current origin
          return window.location.origin;
        } else {
          // In development, try multiple URLs
          return window.location.origin;
        }
      }
      return '';
    };

    const baseUrl = getBaseUrl();
    
    // Socket.IO configuration optimized for Vercel
    const socketConfig = {
      path: '/api/socketio',
      transports: ['polling', 'websocket'] as const,
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 10,
      autoConnect: false, // We'll handle connection manually
      withCredentials: true,
      extraHeaders: {
        'x-vercel-environment': process.env.NODE_ENV || 'development'
      }
    };

    console.log('Creating Socket.IO client with config:', {
      baseUrl,
      path: socketConfig.path,
      transports: socketConfig.transports
    });

    const socketInstance = io(baseUrl, socketConfig);
    
    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('✅ Socket.IO connected to Vercel');
      setIsConnected(true);
      setConnectionError('');
      setConnectionAttempts(0);
      onConnect?.();
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      setIsConnected(false);
      onDisconnect?.(reason);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      setConnectionError(error.message);
      setConnectionAttempts(prev => prev + 1);
      onError?.(error);
    });

    // Set the socket instance
    setSocket(socketInstance);

    // Auto-connect if enabled
    if (autoConnect) {
      socketInstance.connect();
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up Socket.IO connection');
      socketInstance.disconnect();
      socketInstance.removeAllListeners();
    };
  }, [options]);

  // Manual connection function
  const connect = () => {
    if (socket && !socket.connected) {
      console.log('Manually connecting Socket.IO...');
      socket.connect();
    }
  };

  // Manual disconnection function
  const disconnect = () => {
    if (socket && socket.connected) {
      console.log('Manually disconnecting Socket.IO...');
      socket.disconnect();
    }
  };

  // Reconnect function
  const reconnect = () => {
    if (socket) {
      console.log('Manually reconnecting Socket.IO...');
      socket.disconnect();
      setTimeout(() => socket.connect(), 100);
    }
  };

  return {
    socket,
    isConnected,
    connectionError,
    connectionAttempts,
    connect,
    disconnect,
    reconnect
  };
};