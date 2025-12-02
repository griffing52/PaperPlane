import { Request, Response } from "express";
import { ocrImage } from "../ocr";
import { verifyFlight } from "../verify";
import { FlightBodyParams } from "../schema";

export const getHealth = (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
};

// TODO: Refactor these or delete.
// I don't know which of these are useful.

export const verifyFlightHandler = async (req: Request, res: Response) => {
  const flightData = req.body as unknown as FlightBodyParams;
  const verifiedFlight = await verifyFlight(flightData);
  res.json(verifiedFlight);
};

export const processOcrImage = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const ocrResult = await ocrImage(req.file.buffer);

  res.status(200).json(ocrResult);
};
