"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketOptions {
  companyId?: number;
  userId?: number;
  autoConnect?: boolean;
}

export function useSocket(options?: UseSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const { companyId, userId, autoConnect = true } = options || {};

    if (!autoConnect) return;

    // Create socket connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const socketInstance = io(socketUrl, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socketInstance;

    // Connection event handlers
    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
      setIsConnected(true);

      // Join rooms
      if (companyId) {
        socketInstance.emit("join_company", companyId);
      }
      if (userId) {
        socketInstance.emit("join_user", userId);
      }
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      // Silently handle connection errors - server may not have socket.io enabled
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Socket connection not available:", error.message);
      }
      setIsConnected(false);
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      if (companyId) {
        socketInstance.emit("leave_company", companyId);
      }
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [options?.companyId, options?.userId, options?.autoConnect]);

  return { socket, isConnected };
}

// Hook for subscribing to specific events
export function useSocketEvent<T = any>(
  socket: Socket | null,
  eventName: string,
  handler: (data: T) => void
) {
  useEffect(() => {
    if (!socket) return;

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName, handler]);
}



