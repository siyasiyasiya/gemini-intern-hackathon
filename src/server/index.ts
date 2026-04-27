import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Track online users per room
const roomPresence = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  let currentRoomId: string | null = null;
  let userId: string | null = null;

  socket.on("join-room", (data: { roomId: string; userId?: string; username?: string }) => {
    currentRoomId = data.roomId;
    userId = data.userId || socket.id;

    socket.join(data.roomId);

    if (!roomPresence.has(data.roomId)) {
      roomPresence.set(data.roomId, new Set());
    }
    roomPresence.get(data.roomId)!.add(userId);

    io.to(data.roomId).emit("presence-update", {
      roomId: data.roomId,
      onlineCount: roomPresence.get(data.roomId)!.size,
      userId,
      username: data.username,
      action: "joined",
    });
  });

  socket.on("leave-room", (data: { roomId: string }) => {
    socket.leave(data.roomId);
    if (userId && roomPresence.has(data.roomId)) {
      roomPresence.get(data.roomId)!.delete(userId);
      io.to(data.roomId).emit("presence-update", {
        roomId: data.roomId,
        onlineCount: roomPresence.get(data.roomId)!.size,
        userId,
        action: "left",
      });
    }
    currentRoomId = null;
  });

  socket.on("new-comment", (data: { roomId: string; comment: unknown }) => {
    socket.to(data.roomId).emit("comment-added", data.comment);
  });

  socket.on("market-update", (data: { ticker: string; yesPrice: number; volume24h: number }) => {
    io.emit("market-price-update", data);
  });

  socket.on("disconnect", () => {
    if (currentRoomId && userId && roomPresence.has(currentRoomId)) {
      roomPresence.get(currentRoomId)!.delete(userId);
      io.to(currentRoomId).emit("presence-update", {
        roomId: currentRoomId,
        onlineCount: roomPresence.get(currentRoomId)!.size,
        userId,
        action: "left",
      });
    }
  });
});

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
