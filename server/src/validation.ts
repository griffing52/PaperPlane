import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

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

type RequestProperty = 'body' | 'params' | 'query';

export const validate = (schema: z.ZodSchema, property: RequestProperty) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req[property]);
      Object.assign(req[property], validated)
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        res.status(400).json({ errors });
        return;
      }
      res.status(500).json({ error: 'Validation failed' });
    }
  };
};

export const flightLogQuerySchema = z.object({
  userId: z.uuid().nullable(),
  flightId: z.uuid().nullable(),
});

export type FlightLogQueryParams = z.infer<typeof flightLogQuerySchema>;


export const flightLogGetSchema = z.object({
  id: z.uuid()
});

export type FlightLogGetParams = z.infer<typeof flightLogGetSchema>;

export const userPostSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  licenseNumber: z.string().min(1),
});

export type UserPostBodyParams = z.infer<typeof userPostSchema>;

export const logbookPostSchema = z.object({
  userId: z.uuid(),
});

export type LogbookPostBodyParams = z.infer<typeof logbookPostSchema>;
