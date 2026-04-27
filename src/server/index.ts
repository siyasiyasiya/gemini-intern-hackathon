import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Track online users per constellation
const constellationPresence = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  let currentConstellationId: string | null = null;
  let userId: string | null = null;

  socket.on("join-constellation", (data: { constellationId: string; userId?: string; username?: string }) => {
    currentConstellationId = data.constellationId;
    userId = data.userId || socket.id;

    socket.join(data.constellationId);

    if (!constellationPresence.has(data.constellationId)) {
      constellationPresence.set(data.constellationId, new Set());
    }
    constellationPresence.get(data.constellationId)!.add(userId);

    io.to(data.constellationId).emit("presence-update", {
      constellationId: data.constellationId,
      onlineCount: constellationPresence.get(data.constellationId)!.size,
      userId,
      username: data.username,
      action: "joined",
    });
  });

  socket.on("leave-constellation", (data: { constellationId: string }) => {
    socket.leave(data.constellationId);
    if (userId && constellationPresence.has(data.constellationId)) {
      constellationPresence.get(data.constellationId)!.delete(userId);
      io.to(data.constellationId).emit("presence-update", {
        constellationId: data.constellationId,
        onlineCount: constellationPresence.get(data.constellationId)!.size,
        userId,
        action: "left",
      });
    }
    currentConstellationId = null;
  });

  socket.on("new-comment", (data: { constellationId: string; comment: unknown }) => {
    socket.to(data.constellationId).emit("comment-added", data.comment);
  });

  socket.on("market-update", (data: { ticker: string; yesPrice: number; volume24h: number }) => {
    io.emit("market-price-update", data);
  });

  socket.on("disconnect", () => {
    if (currentConstellationId && userId && constellationPresence.has(currentConstellationId)) {
      constellationPresence.get(currentConstellationId)!.delete(userId);
      io.to(currentConstellationId).emit("presence-update", {
        constellationId: currentConstellationId,
        onlineCount: constellationPresence.get(currentConstellationId)!.size,
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
