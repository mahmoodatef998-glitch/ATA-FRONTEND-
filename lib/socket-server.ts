import { Server } from "socket.io";
import { Server as HTTPServer } from "http";

export function initSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3005",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io/",
  });

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    // Join company room
    socket.on("join_company", (companyId: number) => {
      socket.join(`company_${companyId}`);
      console.log(`👥 User joined company room: company_${companyId}`);
    });

    // Join user-specific room
    socket.on("join_user", (userId: number) => {
      socket.join(`user_${userId}`);
      console.log(`👤 User joined personal room: user_${userId}`);
    });

    // Leave company room
    socket.on("leave_company", (companyId: number) => {
      socket.leave(`company_${companyId}`);
      console.log(`👋 User left company room: company_${companyId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  return io;
}

// Type augmentation for global socket
declare global {
  var io: Server | undefined;
}



