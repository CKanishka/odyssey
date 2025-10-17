import { Router } from "express";
import { Liveblocks } from "@liveblocks/node";
import { nanoid } from "nanoid";
import { uniqueNamesGenerator, starWars, colors } from "unique-names-generator";

const router = Router();

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "",
});

// Liveblocks authentication endpoint
router.post("/auth", async (req, res) => {
  try {
    const { room, userId } = req.body;

    if (!room) {
      return res.status(400).json({ error: "Room is required" });
    }

    // Generate a random user ID if not provided
    const userIdToUse = userId || `user-${nanoid(10)}`;

    // Generate a Star Wars character name
    const userName = uniqueNamesGenerator({
      dictionaries: [starWars],
      style: "capital",
    });

    // Generate a color name
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
