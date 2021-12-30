import http from 'http';
import { Server } from 'socket.io';

export const getAppServer = (expressApp) => {
  const server = http.createServer(expressApp);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  return {
    server: server,
    io: io,
  };
};
