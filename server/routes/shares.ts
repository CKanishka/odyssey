import { Router } from "express";
import { nanoid } from "nanoid";
import { prisma } from "../index.js";

const router = Router();

// Create a share link for a presentation or slide
router.post("/", async (req, res) => {
  try {
    const { presentationId, slideId, type } = req.body;

    const shareData = {
      shareId: nanoid(10),
      presentationId,
      type: type || "PRESENTATION",
      slideId: slideId || null,
    };

    if (slideId) {
      shareData.type = "SLIDE";
    }

    const share = await prisma.share.create({
      data: shareData,
      include: {
        presentation: true,
        slide: true,
      },
    });

    res.json(share);
  } catch (error) {
    console.error("Error creating share:", error);
    res.status(500).json({ error: "Failed to create share link" });
  }
});

// Get share information by shareId
router.get("/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;

    const share = await prisma.share.findUnique({
      where: { shareId },
      include: {
        presentation: {
          include: {
            slides: {
              orderBy: {
                position: "asc",
              },
            },
          },
        },
        slide: true,
      },
    });

    if (!share) {
      return res.status(404).json({ error: "Share link not found" });
    }

    // Check if share has expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      return res.status(410).json({ error: "Share link has expired" });
    }

    res.json(share);
  } catch (error) {
    console.error("Error fetching share:", error);
    res.status(500).json({ error: "Failed to fetch share" });
  }
});

// Get all shares for a presentation
router.get("/presentation/:presentationId", async (req, res) => {
  try {
    const { presentationId } = req.params;

    const shares = await prisma.share.findMany({
      where: { presentationId },
      include: {
        slide: true,
      },
    });

    res.json(shares);
  } catch (error) {
    console.error("Error fetching shares:", error);
    res.status(500).json({ error: "Failed to fetch shares" });
  }
});

// Delete a share
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.share.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting share:", error);
    res.status(500).json({ error: "Failed to delete share" });
  }
});

export default router;
