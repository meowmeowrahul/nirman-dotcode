const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    // Intentional minimal startup logging for ops visibility.
    console.log(`Server listening on ${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
