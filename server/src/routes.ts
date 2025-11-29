import { Router } from "express";
import { upload } from "./config";
import { validate } from "./middleware/validation";
import { requireUser, verifyFlightEntryOwnership } from "./middleware/auth";
import {
  flightEntryQuerySchema,
  flightEntryGetSchema,
  flightEntryPostSchema,
  flightEntryPatchSchema,
  userPostSchema,
  ocrSchema,
  flightSchema,
} from "./schema";
import * as controllers from "./controllers/controllers";
import * as flightControllers from "./controllers/FlightEntryController";

// DESIGN DECISION: I could have put separate routs into a routes/ directory,
// but I think that would make the code more complex
// since each route is fairly simple.

const router = Router();

router.get("/api/v1/health", controllers.getHealth);

router.get(
  "/api/v1/flight_entry",
  validate(flightEntryQuerySchema, "query"),
  requireUser,
  flightControllers.listFlightEntries,
);

router.get(
  "/api/v1/flight_entry/:id",
  validate(flightEntryGetSchema, "params"),
  requireUser,
  verifyFlightEntryOwnership,
  flightControllers.getFlightEntryById,
);

router.delete(
  "/api/v1/flight_entry/:id",
  validate(flightEntryGetSchema, "params"),
  requireUser,
  verifyFlightEntryOwnership,
  flightControllers.deleteFlightEntry,
);

router.patch(
  "/api/v1/flight_entry/:id",
  validate(flightEntryGetSchema, "params"),
  validate(flightEntryPatchSchema, "body"),
  requireUser,
  verifyFlightEntryOwnership,
  flightControllers.updateFlightEntry,
);

router.post(
  "/api/v1/flight_entry/",
  validate(flightEntryPostSchema, "body"),
  requireUser,
  flightControllers.createFlightEntry,
);

router.post(
  "/api/v1/user/",
  validate(userPostSchema, "body"),
  controllers.createUser,
);

router.post(
  "/api/v1/verify/",
  validate(flightSchema, "body"),
  controllers.verifyFlightHandler,
);

router.post(
  "/api/v1/ocr/",
  upload.single("image"),
  validate(ocrSchema, "body"),
  controllers.processOcrImage,
);

export default router;
