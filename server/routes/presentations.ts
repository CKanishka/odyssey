import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate, requireAuth } from "../middleware/auth.js";
import { AuthorizationService } from "../services/authorizationService.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new presentation (requires authentication)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title } = req.body;

    const presentation = await prisma.presentation.create({
      data: {
        title: title || "Untitled Presentation",
        userId: req.user!.userId,
        slides: {
          create: {
            position: 0,
            content: {},
          },
        },
      },
      include: {
        slides: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    res.json(presentation);
  } catch (error) {
    console.error("Error creating presentation:", error);
    res.status(500).json({ error: "Failed to create presentation" });
  }
});

// Get a presentation by ID with access control
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { shareId } = req.query;
    const userId = req.user?.userId || null;

    // Check access using authorization service
    const { hasAccess, presentation } =
      await AuthorizationService.checkPresentationAccess(
        userId,
        id,
        shareId as string | undefined
      );

    if (!hasAccess || !presentation) {
      return res
        .status(403)
        .json({ error: "You don't have access to this presentation" });
    }

    res.json(presentation);
  } catch (error) {
    console.error("Error fetching presentation:", error);
    res.status(500).json({ error: "Failed to fetch presentation" });
  }
});

// Update presentation title
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, shareId } = req.body;
    const userId = req.user?.userId || null;

    // Check if user can edit
    const canEdit = await AuthorizationService.canEditPresentation(
      userId,
      id,
      shareId
    );

    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "You don't have permission to edit this presentation" });
    }

    const presentation = await prisma.presentation.update({
      where: { id },
      data: { title },
      include: {
        slides: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    res.json(presentation);
  } catch (error) {
    console.error("Error updating presentation:", error);
    res.status(500).json({ error: "Failed to update presentation" });
  }
});

// Delete a presentation (owner only)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || null;

    // Check if user can delete (owner only)
    const canDelete = await AuthorizationService.canEditPresentation(
      userId,
      id
    );

    if (!canDelete) {
      return res
        .status(403)
        .json({ error: "Only the owner can delete this presentation" });
    }

    await prisma.presentation.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting presentation:", error);
    res.status(500).json({ error: "Failed to delete presentation" });
  }
});

// Get all presentations for current user
router.get("/", requireAuth, async (req, res) => {
  try {
    const presentations = await prisma.presentation.findMany({
      where: { userId: req.user!.userId },
      include: {
        slides: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(presentations);
  } catch (error) {
    console.error("Error fetching presentations:", error);
    res.status(500).json({ error: "Failed to fetch presentations" });
  }
});

export default router;
