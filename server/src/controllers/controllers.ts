import { Request, Response } from "express";
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
