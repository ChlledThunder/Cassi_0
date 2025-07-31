import { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'socket.io';
import { initializeSocketServer } from '@/lib/socket-server';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (res.socket.server.io) {
    console.log('Socket.IO already initialized');
  } else {
    console.log('Initializing Socket.IO server...');
    const io = initializeSocketServer(res.socket.server);
    res.socket.server.io = io;
  }
  
  res.end();
}