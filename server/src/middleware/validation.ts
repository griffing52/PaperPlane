import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// Zod validation middleware factory

// AI Disclosure by Bolun Thompson.
// I used Claude Sonnet 4.5 with thinking enabled.
// The prompt to generate this validation factory was as follows.
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
