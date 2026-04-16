const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    },
  });

  app.set("io", io);

  server.listen(PORT, () => {
    // Intentional minimal startup logging for ops visibility.
    console.log(`Server listening on ${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
