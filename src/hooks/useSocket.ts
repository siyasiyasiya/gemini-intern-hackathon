"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket/client";

export function useSocket(communityId?: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const joinedRef = useRef(false);

  useEffect(() => {
    const socket = connectSocket();

    if (communityId && !joinedRef.current) {
      socket.emit("join-community", {
        communityId,
        userId: session?.user?.id,
        username: session?.user?.name,
      });
      joinedRef.current = true;
    }

    socket.on("comment-added", () => {
      if (communityId) {
        queryClient.invalidateQueries({ queryKey: ["comments", communityId] });
      }
    });

    socket.on("presence-update", (data: { communityId: string; onlineCount: number }) => {
      // Could store in zustand for live presence display
    });

    socket.on("market-price-update", () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    });

    return () => {
      if (communityId && joinedRef.current) {
        socket.emit("leave-community", { communityId });
        joinedRef.current = false;
      }
      socket.off("comment-added");
      socket.off("presence-update");
      socket.off("market-price-update");
    };
  }, [communityId, session, queryClient]);

  const emitNewComment = useCallback(
    (comment: unknown) => {
      if (communityId) {
        getSocket().emit("new-comment", { communityId, comment });
      }
    },
    [communityId]
  );

  return { emitNewComment };
}
