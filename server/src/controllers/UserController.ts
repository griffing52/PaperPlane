import { Request, Response } from "express";
import { authFromHeader } from "../middleware/auth";
import { UserPostBodyParams } from "../schema";
import { prisma } from "../config";

export const createUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let auth;

    if (!authHeader || !(auth = await authFromHeader(authHeader))) {
      res.status(401).json({ error: "Invalid auth token" });
      return;
    }

    const { email, emailHash } = auth;

    const { name, licenseNumber } =
      req.body as unknown as UserPostBodyParams;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        emailHash,
        licenseNumber,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
