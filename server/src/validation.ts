import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// Generic validation middleware factory
// AI Disclosure by Bolun Thompson. I used Claude Code with Sonnet 4.5 with Thinking enabled.
// The previous API endpoints in this repo were
// (1): not based on real requirements
// (2): AI generated
// They were useful to test that I'd setup the DB correctly,
// and for an example as to how to use express and prisma and zod,
// but I've replaced them with hand-written endpoints expressing our buisneiss logic.
//
// I've kept this zod middleware for validation, since its precisely what
// I want for validation.
//
// The prompt for validate the old endpoints was as follows:
// Use Zod to implement request validation for the implemented endpoints.
// Make sure that the validation code is elegant and clean, returning properly
// typed typescript.

type RequestProperty = "body" | "params" | "query";

export const validate = (schema: z.ZodSchema, property: RequestProperty) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req[property]);
      Object.assign(req[property], validated);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        res.status(400).json({ errors });
        return;
      }
      res.status(500).json({ error: "Validation failed" });
    }
  };
};

export const flightEntryQuerySchema = z.object({
  userId: z.uuid().optional(),
  flightId: z.uuid().optional(),
});

export type FlightEntryQueryParams = z.infer<typeof flightEntryQuerySchema>;

export const flightEntryGetSchema = z.object({
  id: z.uuid(),
});

export type FlightEntryGetParams = z.infer<typeof flightEntryGetSchema>;

export const userPostSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  licenseNumber: z.string().min(1),
});

export type UserPostBodyParams = z.infer<typeof userPostSchema>;

export const ocrSchema = z.object({});

export type OcrBodyParams = z.infer<typeof ocrSchema>;

export const flightSchema = z.object({
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
  userId: z.string().uuid(),
  logbookUrl: z.string().url().optional(),
  totalFlightTime: z.coerce.number().nonnegative().optional(),
  soloTime: z.coerce.number().nonnegative().optional(),
  dualReceivedTime: z.coerce.number().nonnegative().optional(),
  crossCountryTime: z.coerce.number().nonnegative().optional(),
  nightTime: z.coerce.number().nonnegative().optional(),
  actualInstrumentTime: z.coerce.number().nonnegative().optional(),
  simulatedInstrumentTime: z.coerce.number().nonnegative().optional(),
});

export type FlightEntryPostParams = z.infer<typeof flightEntryPostSchema>;
