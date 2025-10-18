import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma.js";
import authRoutes from "./routes/auth.js";
import presentationRoutes from "./routes/presentations.js";
import slideRoutes from "./routes/slides.js";
import shareRoutes from "./routes/shares.js";
import liveblocksRoutes from "./routes/liveblocks.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/presentations", presentationRoutes);
app.use("/api/slides", slideRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/liveblocks", liveblocksRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Only start the server if not running in Vercel serverless environment
// Vercel will import this file and use the exported app
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

// Export the Express app for Vercel serverless functions
export default app;
