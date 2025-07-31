# Vercel-Compatible Socket.IO Implementation

This guide explains how to implement Socket.IO in a Next.js application that works with Vercel's serverless environment.

## Problem

Traditional Socket.IO implementations don't work well with Vercel because:
1. Vercel uses serverless functions that don't maintain persistent connections
2. Each request may be handled by a different server instance
3. In-memory state is lost between function invocations

## Solution

### 1. Vercel-Compatible Socket.IO Server (`src/lib/socket-vercel.ts`)

Key features:
- Uses server instance attached to response object for state persistence
- Optimized timeout and connection settings for serverless environment
- Enhanced CORS configuration for Vercel deployment
- Fallback transport methods for better compatibility

```typescript
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

  // ... socket event handlers
};
```

### 2. Vercel-Compatible Socket.IO Hook (`src/hooks/use-socket-vercel.ts`)

Features:
- Automatic connection management
- Enhanced error handling and reconnection logic
- Vercel-specific configuration
- Manual connection controls

```typescript
export const useSocketVercel = (options: UseSocketVercelOptions = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
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
      autoConnect: false,
      withCredentials: true,
      extraHeaders: {
        'x-vercel-environment': process.env.NODE_ENV || 'development'
      }
    };

    const socketInstance = io(baseUrl, socketConfig);
    // ... event handlers
  }, [options]);

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
```

### 3. Pages API Route (`src/pages/api/socketio.ts`)

Socket.IO works better with Pages API routes than App Router routes in Next.js:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { initializeVercelSocketServer } from '@/lib/socket-vercel';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (res.socket.server.io) {
    console.log('Socket.IO already initialized');
  } else {
    console.log('Initializing Socket.IO server for Vercel...');
    const io = initializeVercelSocketServer(res.socket.server);
    res.socket.server.io = io;
  }
  
  res.end();
}
```

### 4. Client-Side Usage

In your React components, use the hook:

```typescript
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

// Set up event listeners
useEffect(() => {
  if (!socket) return;

  socket.on('roomCreated', (data) => {
    console.log('Room created:', data);
  });

  socket.on('playerJoined', (data) => {
    console.log('Player joined:', data);
  });

  return () => {
    socket.off('roomCreated');
    socket.off('playerJoined');
  };
}, [socket]);
```

## Vercel Deployment Considerations

### 1. Environment Variables

Set these in your Vercel project:

```bash
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
VERCEL_URL=https://your-app.vercel.app
NODE_ENV=production
```

### 2. Serverless Function Timeout

Vercel has a maximum execution time for serverless functions (10 seconds for Hobby, 15 minutes for Pro). Socket.IO connections may timeout after long periods of inactivity.

### 3. Cold Starts

Serverless functions have "cold starts" which can cause brief delays when establishing new connections. The implementation includes retry logic to handle this.

### 4. State Management

Since serverless functions don't maintain state between invocations:
- Room data is stored on the server instance attached to the response object
- For production use with multiple users, consider adding external state management (Redis, database)

### 5. Connection Limits

Vercel has concurrent execution limits. For high-traffic applications, consider:
- Using WebSockets through Vercel's Edge Functions
- Implementing connection pooling
- Adding rate limiting

## Testing

Use the test page at `/socket-test` to verify Socket.IO functionality:

```bash
# Navigate to the test page
http://localhost:3000/socket-test
```

The test page includes:
- Connection status indicators
- Manual connection controls
- Test message functionality
- Multiplayer room testing
- Debug information

## Troubleshooting

### Common Issues:

1. **Connection timeouts**: Increase timeout values in socket configuration
2. **CORS errors**: Ensure proper CORS configuration for your Vercel domain
3. **State loss**: Implement external state management for production
4. **Cold starts**: Add retry logic and user feedback during connection

### Debug Tips:

1. Check browser console for connection errors
2. Monitor Vercel function logs for server-side errors
3. Use the test page to isolate connection issues
4. Verify environment variables are set correctly

## Production Recommendations

For production deployment on Vercel:

1. **Add monitoring**: Track connection success rates and error rates
2. **Implement fallbacks**: Provide alternative communication methods if Socket.IO fails
3. **Add rate limiting**: Prevent abuse of connection endpoints
4. **Use external state**: Consider Redis or database for persistent state
5. **Optimize for cold starts**: Minimize initialization time

## Limitations

This solution works well for:
- Small to medium multiplayer applications
- Real-time features with moderate traffic
- Development and prototyping

For large-scale production applications, consider:
- Vercel Edge Functions for WebSockets
- Dedicated WebSocket services (Pusher, Ably)
- Custom server infrastructure