import { Router } from "express";
import { nanoid } from "nanoid";
import { prisma } from "../index.js";
import { authenticate } from "../middleware/auth.js";
import { AuthorizationService } from "../services/authorizationService.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a share link for a presentation or slide (owner only)
router.post("/", async (req, res) => {
  try {
    const { presentationId, slideId, type, permission } = req.body;
    const userId = req.user?.userId || null;

    // Check if user can share (owner only)
    const canShare = await AuthorizationService.canSharePresentation(
      userId,
      presentationId
    );

    if (!canShare) {
      return res
        .status(403)
        .json({ error: "Only the owner can create share links" });
    }

    const shareData = {
      shareId: nanoid(10),
      presentationId,
      type: type || "PRESENTATION",
      permission: permission || "edit",
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
