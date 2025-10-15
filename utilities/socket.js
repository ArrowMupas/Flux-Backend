const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');

function initializeSocket(server, app, FRONTEND) {
    const io = new Server(server, {
        cors: {
            origin: FRONTEND,
            credentials: true,
        },
    });

    io.use((socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers.cookie || '');
        const { token } = cookies;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            socket.user = decoded;
            next();
        } catch {
            next(new Error('Authentication error'));
        }
    });

    // Make io accessible in controllers
    app.set('io', io);

    // Handle connections
    io.on('connection', (socket) => {
        console.log('🟢 Socket connected:', socket.id);

        socket.on('join-admin', () => {
            socket.join('admins');
            console.log('👑 Admin joined room:', socket.id);
        });

        socket.on('join-staff', (staffId) => {
            const roomName = `staff_${staffId}`;
            socket.join(roomName);
            console.log(`👤 Staff ${staffId} joined room: ${roomName}`);
        });

        socket.on('disconnect', () => {
            console.log('🔴 Socket disconnected:', socket.id);
        });
    });

    return io;
}

module.exports = initializeSocket;
