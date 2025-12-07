import { createServer } from "http";
import { parse } from "url";
import { exec } from "child_process";
import next from "next";
import { initSocketServer } from "./lib/socket-server";
import { isCloudinaryConfigured, getCloudinaryInstance } from "./lib/cloudinary";
import { prisma } from "./lib/prisma";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3005;

// Initialize Next.js app
console.log("🔧 Initializing Next.js app...");
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
console.log("✅ Next.js app initialized");

// Startup checks
async function performStartupChecks() {
  console.log("");
  console.log("🔍 ========================================");
  console.log("🔍 Performing startup checks...");
  console.log("🔍 ========================================");
  console.log("");

  // Check PostgreSQL connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ PostgreSQL: Connected");
  } catch (error) {
    console.error("❌ PostgreSQL: Connection failed");
    console.error("   Error:", error instanceof Error ? error.message : String(error));
  }

  // Check Cloudinary configuration
  try {
    const cloudinaryConfigured = isCloudinaryConfigured();
    if (cloudinaryConfigured) {
      const cloudinaryInstance = getCloudinaryInstance();
      if (cloudinaryInstance) {
        console.log("✅ Cloudinary: Configured successfully");
      } else {
        console.log("⚠️  Cloudinary: Credentials found but initialization failed");
      }
    } else {
      console.log("ℹ️  Cloudinary: Not configured (using local storage)");
    }
  } catch (error) {
    console.error("❌ Cloudinary: Check failed");
    console.error("   Error:", error instanceof Error ? error.message : String(error));
  }

  // Check port availability
  try {
    // Port check is done by server.listen() itself
    console.log(`✅ Port ${port}: Available`);
  } catch (error) {
    console.error(`❌ Port ${port}: Already in use`);
  }

  console.log("");
  console.log("🔍 ========================================");
  console.log("");
}

console.log("⏳ Preparing Next.js app (this may take a moment)...");
app.prepare().then(async () => {
  console.log("✅ Next.js app prepared successfully");
  
  // Perform startup checks
  await performStartupChecks();
  
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.io
  const io = initSocketServer(server);
  
  // Make io accessible globally
  global.io = io;

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log("");
      console.log("🚀 ========================================");
      console.log("✅ Server started successfully!");
      console.log(`🌐 Frontend: http://${hostname}:${port}`);
      console.log(`🔌 WebSocket: ws://${hostname}:${port}`);
      console.log("🚀 ========================================");
      console.log("");
      console.log("📝 Next.js is ready! You can now:");
      console.log(`   - Open browser: http://${hostname}:${port}`);
      console.log(`   - Prisma Studio: npm run prisma:studio`);
      console.log("");
      
      // Open browser automatically (only in development)
      if (dev) {
        const url = `http://${hostname}:${port}`;
        
        // Wait a moment for Next.js to fully compile
        setTimeout(() => {
          console.log(`🌐 Opening browser: ${url}`);
          
          // Windows
          if (process.platform === 'win32') {
            exec(`start ${url}`, (error: any) => {
              if (error) {
                console.log(`⚠️  Could not open browser automatically. Please open manually: ${url}`);
              } else {
                console.log(`✅ Browser opened successfully!`);
              }
            });
          }
          // macOS
          else if (process.platform === 'darwin') {
            exec(`open ${url}`, (error: any) => {
              if (error) {
                console.log(`⚠️  Could not open browser automatically. Please open manually: ${url}`);
              } else {
                console.log(`✅ Browser opened successfully!`);
              }
            });
          }
          // Linux
          else {
            exec(`xdg-open ${url}`, (error: any) => {
              if (error) {
                console.log(`⚠️  Could not open browser automatically. Please open manually: ${url}`);
              } else {
                console.log(`✅ Browser opened successfully!`);
              }
            });
          }
        }, 2000); // Wait 2 seconds for Next.js to compile
      }
    });
}).catch((err) => {
  console.error("❌ Failed to start server:");
  console.error(err);
  process.exit(1);
});



