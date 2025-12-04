import { Request, Response } from "express";
import { prisma } from "./../config";
import {
  FlightEntryQueryParams,
  FlightEntryPostParams,
  FlightEntryPatchParams,
} from "./../schema";

export const listFlightEntries = async (req: Request, res: Response) => {
  const { flightId } = req.query as unknown as FlightEntryQueryParams;

  const flightEntries = await prisma.flightEntry.findMany({
    where: {
      userId: req.user!.id,
      ...(flightId != null && { flightId }),
    },
    orderBy: {
      date: 'desc',
    },
  });
  res.status(201).json(flightEntries);
};

export const getFlightEntryById = async (req: Request, res: Response) => {
  const { user: _, ...flightEntryWithoutUser } = req.flightEntry!;

  res.json(flightEntryWithoutUser);
};

export const deleteFlightEntry = async (req: Request, res: Response) => {
  const { id } = req.params;

  const deletedEntry = await prisma.flightEntry.delete({ where: { id } });

  res.json(deletedEntry);
};

export const updateFlightEntry = async (req: Request, res: Response) => {
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
};

export const createFlightEntry = async (req: Request, res: Response) => {
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
};
