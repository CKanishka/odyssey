import { Router } from "express";
import { prisma } from "../index.js";

const router = Router();

// Create a new slide
router.post("/", async (req, res) => {
  try {
    const { presentationId, position } = req.body;

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

    // Moving slide down (increasing position)
    if (newPosition > oldPosition) {
      await prisma.slide.updateMany({
        where: {
          presentationId: slide.presentationId,
          position: {
            gt: oldPosition,
            lte: newPosition,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });
    } else {
      // Moving slide up (decreasing position)
      await prisma.slide.updateMany({
        where: {
          presentationId: slide.presentationId,
          position: {
            gte: newPosition,
            lt: oldPosition,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });
    }

    const updatedSlide = await prisma.slide.update({
      where: { id },
      data: { position: newPosition },
    });

    res.json(updatedSlide);
  } catch (error) {
    console.error("Error updating slide position:", error);
    res.status(500).json({ error: "Failed to update slide position" });
  }
});

// Delete a slide
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const slide = await prisma.slide.findUnique({
      where: { id },
    });

    if (!slide) {
      return res.status(404).json({ error: "Slide not found" });
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
