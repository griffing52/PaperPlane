import { User, FlightEntry } from "@prisma/client";
// to extend the Request object to satisfy the type checker
declare global {
  namespace Express {
    interface Request {
      user?: User;
      // intersection type
      flightEntry?: FlightEntry & { user: User };
    }
  }
}

export {};
