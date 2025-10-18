import { Router } from "express";
import { Liveblocks } from "@liveblocks/node";
import { nanoid } from "nanoid";
import { uniqueNamesGenerator, starWars, colors } from "unique-names-generator";
import { authenticate } from "../middleware/auth";

const router = Router();

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "",
});

router.use(authenticate);

// Liveblocks authentication endpoint
router.post("/auth", async (req, res) => {
  try {
    const { room } = req.body;
    const user = req.user;

    if (!room) {
      return res.status(400).json({ error: "Room is required" });
    }

    const userIdToUse = user?.userId || `guest-${nanoid(10)}`;
    const userName =
      user?.name ||
      user?.email ||
      uniqueNamesGenerator({
        dictionaries: [starWars],
        style: "capital",
      });

    // Generate a color name for everyone
    const colorName = uniqueNamesGenerator({
      dictionaries: [colors],
      style: "lowerCase",
    });

    // Prepare the session
    const session = liveblocks.prepareSession(userIdToUse, {
      userInfo: {
        name: userName,
        color: colorName,
      },
    });

    // Give user access to the room
    session.allow(room, session.FULL_ACCESS);

    // Authorize the user and return the token
    const { status, body } = await session.authorize();
    res.status(status).send(body);
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    res.status(500).json({ error: "Failed to authorize" });
  }
});

export default router;
