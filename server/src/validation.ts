import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Schema for creating a new flight entry
export const CreateFlightSchema = z.object({
  pilotId: z.string().uuid({ message: 'Invalid pilot ID format' }),
  uploadId: z.string().uuid({ message: 'Invalid upload ID format' }).nullable().optional(),
  departureAirfield: z.string().min(1, { message: 'Departure airfield is required' }),
  tailNumber: z.string().min(1, { message: 'Tail number is required' }),
  depDate: z.string().datetime({ message: 'Invalid date format, expected ISO 8601 datetime' }),
  hours: z.number().positive({ message: 'Hours must be a positive number' }).or(
    z.string().refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      { message: 'Hours must be a positive number' }
    )
  ),
});

// Schema for flight ID parameter validation
export const FlightIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid flight ID format' }),
});

// Schema for flights query parameters
export const FlightsQuerySchema = z.object({
  pilotId: z.string().uuid({ message: 'Invalid pilot ID format' }).optional(),
});

// Inferred TypeScript types from schemas (for autocomplete!)
export type CreateFlightInput = z.infer<typeof CreateFlightSchema>;
export type FlightIdParam = z.infer<typeof FlightIdParamSchema>;
export type FlightsQuery = z.infer<typeof FlightsQuerySchema>;

// Type to specify what part of the request to validate
type RequestProperty = 'body' | 'query' | 'params';

// Generic validation middleware factory
export const validate = (schema: z.ZodSchema, property: RequestProperty = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req[property]);
      req[property] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: z.ZodIssue) => ({
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
