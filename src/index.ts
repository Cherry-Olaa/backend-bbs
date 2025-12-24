import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import { connectDB } from "./config/config";

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 BUSYBRAINS backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start", err);
  process.exit(1);
});