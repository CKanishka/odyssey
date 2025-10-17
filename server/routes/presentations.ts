import { Router } from "express";
import { prisma } from "../index.js";

const router = Router();

// Create a new presentation
router.post("/", async (req, res) => {
  try {
    const { title } = req.body;

    const presentation = await prisma.presentation.create({
      data: {
        title: title || "Untitled Presentation",
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

// Get a presentation by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const presentation = await prisma.presentation.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!presentation) {
      return res.status(404).json({ error: "Presentation not found" });
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
    const { title } = req.body;

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

// Delete a presentation
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.presentation.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting presentation:", error);
    res.status(500).json({ error: "Failed to delete presentation" });
  }
});

export default router;
