"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket/client";

export function useSocket(roomId?: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const joinedRef = useRef(false);

  useEffect(() => {
    const socket = connectSocket();

    if (roomId && !joinedRef.current) {
      socket.emit("join-room", {
        roomId,
        userId: session?.user?.id,
        username: session?.user?.name,
      });
      joinedRef.current = true;
    }

    socket.on("comment-added", () => {
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ["comments", roomId] });
      }
    });

    socket.on("presence-update", (data: { roomId: string; onlineCount: number }) => {
      // Could store in zustand for live presence display
    });

    socket.on("market-price-update", () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    });

    return () => {
      if (roomId && joinedRef.current) {
        socket.emit("leave-room", { roomId });
        joinedRef.current = false;
      }
      socket.off("comment-added");
      socket.off("presence-update");
      socket.off("market-price-update");
    };
  }, [roomId, session, queryClient]);

  const emitNewComment = useCallback(
    (comment: unknown) => {
      if (roomId) {
        getSocket().emit("new-comment", { roomId, comment });
      }
    },
    [roomId]
  );

  return { emitNewComment };
}
