import { Request, Response } from "express";
import { prisma } from "./config";
import { ocrImage } from "./ocr";
import { verifyFlight } from "./verify";
import {
  FlightEntryQueryParams,
  FlightEntryPostParams,
  FlightEntryPatchParams,
  UserPostBodyParams,
  FlightBodyParams,
} from "./validation";

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

export const listFlightEntries = async (req: Request, res: Response) => {
  try {
    const { flightId } = req.query as unknown as FlightEntryQueryParams;

    const flightEntries = await prisma.flightEntry.findMany({
      where: {
        userId: req.user!.id,
        ...(flightId != null && { flightId }),
      },
    });
    res.status(201).json(flightEntries);
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getFlightEntryById = async (req: Request, res: Response) => {
  try {
    const { user: _, ...flightEntryWithoutUser } = req.flightEntry!;

    res.json(flightEntryWithoutUser);
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteFlightEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedEntry = await prisma.flightEntry.delete({ where: { id } });

    res.json(deletedEntry);
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateFlightEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body as unknown as FlightEntryPatchParams;

    const { logbookUrl, ...restUpdates } = updates;

    const updatedEntry = await prisma.flightEntry.update({
      where: { id },
      data: {
        ...restUpdates,
        // because the field is named differently in the DB
        ...(logbookUrl !== undefined && { logbookURL: logbookUrl }),
      },
    });

    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createFlightEntry = async (req: Request, res: Response) => {
  try {
    const {
      logbookUrl,
      date,
      tailNumber,
      srcIcao,
      destIcao,
      route,
      totalFlightTime,
      picTime,
      dualReceivedTime,
      crossCountry,
      night,
      solo,
      instrumentTime,
      dayLandings,
      nightLandings,
      remarks,
    } = req.body as unknown as FlightEntryPostParams;

    // Design Decision:
    // All the fields are optional except for date, src, dest and tail number
    // I think the requirements for what the frontend needs to show may change
    // so I'd rather have too many fields and a flexible API rather than too few.
    const flightEntry = await prisma.flightEntry.create({
      data: {
        userId: req.user!.id,
        logbookURL: logbookUrl,
        date,
        tailNumber,
        srcIcao,
        destIcao,
        route,
        totalFlightTime: totalFlightTime ?? 0,
        picTime: picTime ?? 0,
        dualReceivedTime: dualReceivedTime ?? 0,
        crossCountry: crossCountry ?? false,
        night: night ?? false,
        solo: solo ?? false,
        instrumentTime: instrumentTime ?? 0,
        dayLandings: dayLandings ?? 0,
        nightLandings: nightLandings ?? 0,
        remarks,
      },
    });
    res.status(201).json(flightEntry);
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

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
