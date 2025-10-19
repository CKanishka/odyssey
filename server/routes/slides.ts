import { Router } from "express";
import prisma from "../lib/prisma.js";
import { AuthorizationService } from "../services/authorizationService.js";
import { authenticate, requireAuth } from "../middleware/auth.js";

const router = Router();

// Create a new slide
router.post("/", requireAuth, async (req, res) => {
  try {
    const { presentationId, position, shareId } = req.body;

    const userId = req.user?.userId || null;

    // Check if user can edit
    const canEdit = await AuthorizationService.canEditPresentation(
      userId,
      presentationId,
      shareId
    );

    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "You don't have permission to edit this presentation" });
    }

    // Increment the position of all slides present after the new position
    await prisma.slide.updateMany({
      where: {
        presentationId,
        position: {
          gte: position,
        },
      },
      data: {
        position: {
          increment: 1,
        },
      },
    });

    const slide = await prisma.slide.create({
      data: {
        presentationId,
        position,
        content: {},
      },
    });

    res.json(slide);
  } catch (error) {
    console.error("Error creating slide:", error);
    res.status(500).json({ error: "Failed to create slide" });
  }
});

// Get a slide by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const slide = await prisma.slide.findUnique({
      where: { id },
      include: {
        presentation: true,
      },
    });

    if (!slide) {
      return res.status(404).json({ error: "Slide not found" });
    }

    res.json(slide);
  } catch (error) {
    console.error("Error fetching slide:", error);
    res.status(500).json({ error: "Failed to fetch slide" });
  }
});

// Update slide content
router.patch("/:id/content", async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const slide = await prisma.slide.update({
      where: { id },
      data: {
        content,
      },
    });

    res.json(slide);
  } catch (error) {
    console.error("Error updating slide content:", error);
    res.status(500).json({ error: "Failed to update slide content" });
  }
});

// Update slide position (reorder)
router.patch("/:id/position", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPosition } = req.body;

    const slide = await prisma.slide.findUnique({
      where: { id },
    });

    if (!slide) {
      return res.status(404).json({ error: "Slide not found" });
    }

    const oldPosition = slide.position;

    if (oldPosition === newPosition) {
      return res.json(slide);
    }

    // NOTE: Naive approach to reorder slides, should be optimized to something like LexoRank

    // Use a transaction to safely reorder slides
    await prisma.$transaction(async (tx) => {
      // Fetch all slides for this presentation
      const allSlides = await tx.slide.findMany({
        where: { presentationId: slide.presentationId },
        orderBy: { position: "asc" },
      });

      // Calculate new positions for all slides
      const updatedSlides = allSlides.map((slide) => {
        if (slide.id === id) {
          return { ...slide, position: newPosition };
        } else if (oldPosition < newPosition) {
          // Moving down
          if (slide.position > oldPosition && slide.position <= newPosition) {
            return { ...slide, position: slide.position - 1 };
          }
        } else if (oldPosition > newPosition) {
          // Moving up
          if (slide.position < oldPosition && slide.position >= newPosition) {
            return { ...slide, position: slide.position + 1 };
          }
        }

        return slide;
      });

      // First pass: Move all slides to temporary negative positions
      for (let i = 0; i < updatedSlides.length; i++) {
        await tx.slide.update({
          where: { id: updatedSlides[i].id },
          data: { position: -(i + 1) },
        });
      }

      // Second pass: Move all slides to their final positions
      for (const update of updatedSlides) {
        await tx.slide.update({
          where: { id: update.id },
          data: { position: update.position },
        });
      }
    });

    // Fetch and return the updated slide
    const updatedSlide = await prisma.slide.findUnique({
      where: { id },
    });

    res.json(updatedSlide);
  } catch (error) {
    console.error("Error updating slide position:", error);
    res.status(500).json({ error: "Failed to update slide position" });
  }
});

// Delete a slide
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { shareId } = req.query;
    const userId = req.user?.userId || null;

    const slide = await prisma.slide.findUnique({
      where: { id },
    });

    if (!slide) {
      return res.status(404).json({ error: "Slide not found" });
    }

    // Check permission
    const canEdit = await AuthorizationService.canEditPresentation(
      userId,
      slide.presentationId,
      shareId as string | undefined
    );

    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "You don't have permission to edit this presentation" });
    }

    // Delete the slide
    await prisma.slide.delete({
      where: { id },
    });

    // Reorder remaining slides
    await prisma.slide.updateMany({
      where: {
        presentationId: slide.presentationId,
        position: {
          gt: slide.position,
        },
      },
      data: {
        position: {
          decrement: 1,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting slide:", error);
    res.status(500).json({ error: "Failed to delete slide" });
  }
});

export default router;
