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
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const { companyId, userId, autoConnect = true } = options || {};

    if (!autoConnect) return;

    // Check if we're on Vercel or production - Socket.io may not be available
    const isVercel = window.location.hostname.includes('vercel.app') || 
                     window.location.hostname.includes('vercel.com');
    const isProduction = process.env.NODE_ENV === 'production';

    // On Vercel, Socket.io is not fully supported, so we'll skip it gracefully
    if (isVercel && isProduction) {
      // Silently skip Socket.io on Vercel - it's not critical for app functionality
      return;
    }

    // Create socket connection with shorter timeout
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const socketInstance = io(socketUrl, {
      path: "/socket.io/",
      transports: ["polling", "websocket"], // Try polling first (more reliable)
      reconnection: true,
      reconnectionDelay: 2000, // Increased delay to reduce spam
      reconnectionAttempts: 3, // Reduced attempts
      timeout: 5000, // 5 second timeout
      forceNew: false,
      autoConnect: true,
    });

    socketRef.current = socketInstance;

    // Set connection timeout - if not connected in 5 seconds, disconnect
    connectionTimeoutRef.current = setTimeout(() => {
      if (!socketInstance.connected) {
        socketInstance.disconnect();
        setIsConnected(false);
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️ Socket connection timeout - Socket.io may not be available on this server");
        }
      }
    }, 5000);

    // Connection event handlers
    socketInstance.on("connect", () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Socket connected:", socketInstance.id);
      }
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
      if (process.env.NODE_ENV === "development") {
        console.log("❌ Socket disconnected:", reason);
      }
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      // Silently handle connection errors - server may not have socket.io enabled
      // This is expected on Vercel and should not block the app
      setIsConnected(false);
      
      // Stop reconnection attempts after first error on Vercel
      if (isVercel) {
        socketInstance.disconnect();
        socketInstance.removeAllListeners();
      }
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      if (process.env.NODE_ENV === "development") {
        console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      }
      setIsConnected(true);
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (companyId && socketInstance.connected) {
        socketInstance.emit("leave_company", companyId);
      }
      socketInstance.disconnect();
      socketInstance.removeAllListeners();
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



