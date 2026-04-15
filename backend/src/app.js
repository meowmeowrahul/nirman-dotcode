const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const searchRoutes = require("./routes/searchRoutes");
const escrowRoutes = require("./routes/escrowRoutes");
const techRoutes = require("./routes/techRoutes");

const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin denied"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/tech", techRoutes);

app.use((error, _req, res, _next) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: "internal server error" });
});

module.exports = app;
