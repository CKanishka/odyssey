import { Router } from "express";
import { AuthService } from "../services/authService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    const result = await AuthService.register({ name, email, password });

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error registering user:", error);
    res.status(400).json({ error: error.message || "Failed to register user" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await AuthService.login({ email, password });

    res.json(result);
  } catch (error: any) {
    console.error("Error logging in:", error);
    res.status(401).json({ error: error.message || "Failed to login" });
  }
});

// Get current user
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await AuthService.getUserById(req.user!.userId);
    res.json(user);
  } catch (error: any) {
    console.error("Error getting user:", error);
    res.status(404).json({ error: error.message || "User not found" });
  }
});

// Change password
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Old password and new password are required" });
    }

    const result = await AuthService.changePassword(
      req.user!.userId,
      oldPassword,
      newPassword
    );

    res.json(result);
  } catch (error: any) {
    console.error("Error changing password:", error);
    res
      .status(400)
      .json({ error: error.message || "Failed to change password" });
  }
});

// Logout (client-side token removal, but endpoint for consistency)
router.post("/logout", (req, res) => {
  // JWT is stateless, so logout is handled client-side by removing the token
  // This endpoint exists for API consistency and future extensions (e.g., token blacklisting)
  res.json({ message: "Logged out successfully" });
});

export default router;
