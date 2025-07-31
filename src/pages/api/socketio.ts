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