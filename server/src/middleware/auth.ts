import { Request, Response, NextFunction } from "express";
import { prisma, emailHash } from "../config";

// TODO: Refactor to use firebase auth
// Lookup user by emailHash based on auth
export const requireUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { emailHash: emailHash },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Verify that requested flight entry is associated with the user
export const verifyFlightEntryOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    const flightEntry = await prisma.flightEntry.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!flightEntry) {
      res.status(404).json({ error: "Flight entry not found" });
      return;
    }

    if (flightEntry.user.emailHash !== req.user.emailHash) {
      res.status(403).json({ error: "Forbidden: Access denied to this flight entry" });
      return;
    }

    req.flightEntry = flightEntry;
    next();
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
