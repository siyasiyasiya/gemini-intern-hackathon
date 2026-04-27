"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket/client";

export function useSocket(constellationId?: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const joinedRef = useRef(false);

  useEffect(() => {
    const socket = connectSocket();

    if (constellationId && !joinedRef.current) {
      socket.emit("join-constellation", {
        constellationId,
        userId: session?.user?.id,
        username: session?.user?.name,
      });
      joinedRef.current = true;
    }

    socket.on("comment-added", () => {
      if (constellationId) {
        queryClient.invalidateQueries({ queryKey: ["comments", constellationId] });
      }
    });

    socket.on("presence-update", (data: { constellationId: string; onlineCount: number }) => {
      // Could store in zustand for live presence display
    });

    socket.on("market-price-update", () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    });

    return () => {
      if (constellationId && joinedRef.current) {
        socket.emit("leave-constellation", { constellationId });
        joinedRef.current = false;
      }
      socket.off("comment-added");
      socket.off("presence-update");
      socket.off("market-price-update");
    };
  }, [constellationId, session, queryClient]);

  const emitNewComment = useCallback(
    (comment: unknown) => {
      if (constellationId) {
        getSocket().emit("new-comment", { constellationId, comment });
      }
    },
    [constellationId]
  );

  return { emitNewComment };
}
