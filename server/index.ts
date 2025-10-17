import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.js";
import presentationRoutes from "./routes/presentations.js";
import slideRoutes from "./routes/slides.js";
import shareRoutes from "./routes/shares.js";
import liveblocksRoutes from "./routes/liveblocks.js";

dotenv.config();

// Debug: Check env vars
console.log("Environment loaded:", {
  hasDBUrl: !!process.env.DATABASE_URL,
  hasLiveblocksKey: !!process.env.LIVEBLOCKS_SECRET_KEY,
  port: process.env.PORT,
});

export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/presentations", presentationRoutes);
app.use("/api/slides", slideRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/liveblocks", liveblocksRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
