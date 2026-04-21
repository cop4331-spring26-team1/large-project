"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = exports.io = exports.userSockets = void 0;
const socket_io_1 = require("socket.io");
exports.userSockets = new Map();
const initSocket = (server) => {
    exports.io = new socket_io_1.Server(server, {
        cors: {
            origin: 'http://localhost:5000',
            credentials: true,
        },
    });
    exports.io.on('connection', (socket) => {
        const userId = socket.handshake.auth.userId;
        if (userId)
            exports.userSockets.set(userId, socket.id);
        socket.on('joinThread', (threadId) => {
            socket.join(threadId);
        });
        socket.on('disconnect', () => {
            exports.userSockets.delete(userId);
        });
    });
    return exports.io;
};
exports.initSocket = initSocket;
