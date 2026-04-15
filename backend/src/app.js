const express = require("express");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const searchRoutes = require("./routes/searchRoutes");
const escrowRoutes = require("./routes/escrowRoutes");
const techRoutes = require("./routes/techRoutes");

const app = express();

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
