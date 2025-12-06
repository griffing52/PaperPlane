import { z } from "zod";

export const flightEntryQuerySchema = z.object({
  flightId: z.uuid().optional(),
});

export type FlightEntryQueryParams = z.infer<typeof flightEntryQuerySchema>;

export const flightEntryGetSchema = z.object({
  id: z.uuid(),
});

export type FlightEntryGetParams = z.infer<typeof flightEntryGetSchema>;

export const userPostSchema = z.object({
  name: z.string().min(1),
});

export type UserPostBodyParams = z.infer<typeof userPostSchema>;

export const flightSchema = z.object({
  id: z.uuid().optional(),
  tailNumber: z.string().optional(),
  aircraftModel: z.string().optional(),
  manufacturer: z.string().optional(),
  originAirportIcao: z.string().optional(),
  destinationAirportIcao: z.string().optional(),
  departureTime: z.coerce.date().optional(),
  arrivalTime: z.coerce.date().optional(),
});

export type FlightBodyParams = z.infer<typeof flightSchema>;

export const flightEntryPostSchema = z.object({
  logbookUrl: z.string().url().optional(),
  date: z.coerce.date(),
  tailNumber: z.string().min(1),
  srcIcao: z.string().length(4), // ICAO codes are 4 characters
  destIcao: z.string().length(4),
  route: z.string().optional(),
  totalFlightTime: z.coerce.number().nonnegative().optional(),
  picTime: z.coerce.number().nonnegative().optional(),
  dualReceivedTime: z.coerce.number().nonnegative().optional(),
  crossCountry: z.coerce.boolean().optional(),
  night: z.coerce.boolean().optional(),
  solo: z.coerce.boolean().optional(),
  instrumentTime: z.coerce.number().nonnegative().optional(),
  dayLandings: z.coerce.number().int().nonnegative().optional(),
  nightLandings: z.coerce.number().int().nonnegative().optional(),
  remarks: z.string().optional(),
});

export type FlightEntryPostParams = z.infer<typeof flightEntryPostSchema>;

export const flightEntryPatchSchema = z.object({
  logbookUrl: z.string().url().optional(),
  date: z.coerce.date().optional(),
  tailNumber: z.string().min(1).optional(),
  srcIcao: z.string().length(4).optional(),
  destIcao: z.string().length(4).optional(),
  route: z.string().optional(),
  totalFlightTime: z.coerce.number().nonnegative().optional(),
  picTime: z.coerce.number().nonnegative().optional(),
  dualReceivedTime: z.coerce.number().nonnegative().optional(),
  crossCountry: z.coerce.boolean().optional(),
  night: z.coerce.boolean().optional(),
  solo: z.coerce.boolean().optional(),
  instrumentTime: z.coerce.number().nonnegative().optional(),
  dayLandings: z.coerce.number().int().nonnegative().optional(),
  nightLandings: z.coerce.number().int().nonnegative().optional(),
  remarks: z.string().optional(),
});

export type FlightEntryPatchParams = z.infer<typeof flightEntryPatchSchema>;
