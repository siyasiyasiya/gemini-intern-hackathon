import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Track online users per community
const communityPresence = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  let currentCommunityId: string | null = null;
  let userId: string | null = null;

  socket.on("join-community", (data: { communityId: string; userId?: string; username?: string }) => {
    currentCommunityId = data.communityId;
    userId = data.userId || socket.id;

    socket.join(data.communityId);

    if (!communityPresence.has(data.communityId)) {
      communityPresence.set(data.communityId, new Set());
    }
    communityPresence.get(data.communityId)!.add(userId);

    io.to(data.communityId).emit("presence-update", {
      communityId: data.communityId,
      onlineCount: communityPresence.get(data.communityId)!.size,
      userId,
      username: data.username,
      action: "joined",
    });
  });

  socket.on("leave-community", (data: { communityId: string }) => {
    socket.leave(data.communityId);
    if (userId && communityPresence.has(data.communityId)) {
      communityPresence.get(data.communityId)!.delete(userId);
      io.to(data.communityId).emit("presence-update", {
        communityId: data.communityId,
        onlineCount: communityPresence.get(data.communityId)!.size,
        userId,
        action: "left",
      });
    }
    currentCommunityId = null;
  });

  socket.on("new-comment", (data: { communityId: string; comment: unknown }) => {
    socket.to(data.communityId).emit("comment-added", data.comment);
  });

  socket.on("market-update", (data: { ticker: string; yesPrice: number; volume24h: number }) => {
    io.emit("market-price-update", data);
  });

  socket.on("disconnect", () => {
    if (currentCommunityId && userId && communityPresence.has(currentCommunityId)) {
      communityPresence.get(currentCommunityId)!.delete(userId);
      io.to(currentCommunityId).emit("presence-update", {
        communityId: currentCommunityId,
        onlineCount: communityPresence.get(currentCommunityId)!.size,
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
