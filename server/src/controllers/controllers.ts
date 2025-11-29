import { Request, Response } from "express";
import { prisma } from "../config";
import { ocrImage } from "../ocr";
import { verifyFlight } from "../verify";
import {
  UserPostBodyParams,
  FlightBodyParams,
} from "../schema";

export const getHealth = (_req: Request, res: Response) => {
  try {
    res.json({ status: "ok", message: "Server is running" });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// TODO: Refactor these or delete.
// I don't know which of these are useful.

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, emailHash, licenseNumber } =
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

export const verifyFlightHandler = async (req: Request, res: Response) => {
  try {
    const flightData = req.body as unknown as FlightBodyParams;
    const verifiedFlight = await verifyFlight(flightData);
    res.json(verifiedFlight);
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const processOcrImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    const ocrResult = await ocrImage(req.file.buffer);

    res.status(200).json(ocrResult);
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
