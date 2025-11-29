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
} from "./validation";
import * as controllers from "./controllers";

const router = Router();

router.get("/api/v1/health", controllers.getHealth);

router.get(
  "/api/v1/flight_entry",
  validate(flightEntryQuerySchema, "query"),
  requireUser,
  controllers.listFlightEntries,
);

router.get(
  "/api/v1/flight_entry/:id",
  validate(flightEntryGetSchema, "params"),
  requireUser,
  verifyFlightEntryOwnership,
  controllers.getFlightEntryById,
);

router.delete(
  "/api/v1/flight_entry/:id",
  validate(flightEntryGetSchema, "params"),
  requireUser,
  verifyFlightEntryOwnership,
  controllers.deleteFlightEntry,
);

router.patch(
  "/api/v1/flight_entry/:id",
  validate(flightEntryGetSchema, "params"),
  validate(flightEntryPatchSchema, "body"),
  requireUser,
  verifyFlightEntryOwnership,
  controllers.updateFlightEntry,
);

router.post(
  "/api/v1/flight_entry/",
  validate(flightEntryPostSchema, "body"),
  requireUser,
  controllers.createFlightEntry,
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
