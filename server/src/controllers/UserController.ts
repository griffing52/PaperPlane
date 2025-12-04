import { Request, Response } from "express";
import { getAuthData } from "../middleware/auth";
import { UserPostBodyParams } from "../schema";
import { prisma } from "../config";

export const createUser = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const auth = await getAuthData(authHeader);

  if (!auth) {
    res.status(401).json({ error: "Invalid auth token" });
    return;
  }

  const { email, emailHash } = auth;

  const { name } = req.body as unknown as UserPostBodyParams;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      emailHash,
    },
  });
  res.status(201).json(user);
};
