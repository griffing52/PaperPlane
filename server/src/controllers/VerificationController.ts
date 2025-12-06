import { verifyFlight } from "../verify";
import { FlightBodyParams } from "../schema";
import { Request, Response } from "express";


export const verifyFlightHandler = async (req: Request, res: Response) => {
  const flightData = req.body as unknown as FlightBodyParams;
  const verifiedFlight = await verifyFlight(flightData.id, flightData);
  res.json(verifiedFlight);
};
