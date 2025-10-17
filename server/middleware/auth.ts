import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService.js";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        name: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * Makes the user optional - attaches user if token is present
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const payload = AuthService.verifyToken(token);
        req.user = payload;
      } catch (error) {
        // Token is invalid, but we continue without user
        // This allows access to shared content
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require authentication
 * Returns 401 if no valid token is present
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const token = authHeader.substring(7);

    try {
      const payload = AuthService.verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch (error) {
    next(error);
  }
};
