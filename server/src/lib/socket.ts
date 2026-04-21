import { Server } from 'socket.io';
import http from 'http';

export const userSockets = new Map<string, string>();
export let io: Server;

export const initSocket = (server: http.Server) => {
    io = new Server(server, {
        cors: {
            origin:      process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        const userId = socket.handshake.auth.userId as string;
        if (userId) userSockets.set(userId, socket.id);

        socket.on('joinThread', (threadId: string) => {
            socket.join(threadId);
        });

        socket.on('disconnect', () => {
            userSockets.delete(userId);
        });
    });

    return io;
};