import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import {
  validate,
  flightEntryQuerySchema,
  flightEntryGetSchema,
  flightEntryPostSchema,
  flightEntryPatchSchema,
  userPostSchema,
  ocrSchema,
  flightSchema,
  FlightEntryQueryParams,
  FlightEntryGetParams,
  FlightEntryPostParams,
  FlightEntryPatchParams,
  UserPostBodyParams,
  FlightBodyParams,
} from "./validation";
import { ocrImage } from "./ocr";
import { verifyFlight } from "./verify";

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// TODO: Replace with actual auth-based emailHash lookup once authentication is implemented
const emailHash = "1c61d3af9e95de4b161dc5c7d5d7e0cbc6de90f884defcfe6d49a5e8bce62806";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

app.get("/api/v1/health", (_req: Request, res: Response) => {
  try {
    res.json({ status: "ok", message: "Server is running" });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// AI Disclosure by Bolun Thompson:
// I used Claude Code with Sonnet 4.5, to refactor the following tests to take a constant emailHash
// rather than a userId, because that's what we're using to connect front-end/back-end.
// I also used it to generate a PATCH endpoint akin to the POST.
// Thinking was enabled for the planning phase but disabled for the implementation phase.
// I've manually written the other endpoints, so I believe I understand my code well enough to
// be able to review AI code to make sure its reasonable quality, and I'm curious about the results.

// You're a skilled senior developer developing endpoints. You have four tasks:
// Implement them in sequence using sub-agents. Make a commit for each task.
// Before implementing any of the tasks, write a comprehensive plan for what you plan to do.
// Make sure to update or write simple tests for each endpoint as part of your plan
// so I can review them to make sure they look good. Make your front-end changes
// as minimal as possible so I can manually check if they look good.
// Ultrathink and write a plan before you refactor. Work as long as you need to.

// 1. Refactor the "flight_entry" get endpoint, that takes an "emailHash" use a constant
// emailHash instead and filter on it. Likewise, refactor the POST endpoint to use the same
// emailHash to look up the user to add the flight entry to.
// Later, we intend to add auth using the emailHash as the id, but we want to use a constant for testing.
// Key thie hash first to the hex sha-256 of michael.smith@outlook.com; make sure items in the DB
// can be correctly looked up using it. Name your constant flightEntry,
// (we're going to inline it as an argument at some point).
// Make sure to change the front-end to aaccomadate (specifically, page.tsx).
// Likewise, refactor the endpoints (GET ID, DELETE ID) to check whether the email hash matches before
// doing the operation.

// 2. Add a patch endpoint for flight_entry consistent with the others. Key it on the
// id of the flight entry. Similarly, check the email hash before doing the operation.

// Results: The refactor works as expected, and the tests look good and pass.
// However, I had to write the endpoint wrapper functions in the front-end myself
// since the AI generated verbose code which tried to do too many changes at once.

app.get(
  "/api/v1/flight_entry",
  validate(flightEntryQuerySchema, "query"),
  async (req: Request, res: Response) => {
    try {
      const { flightId } = req.query as unknown as FlightEntryQueryParams;

      // Look up user by constant emailHash
      const user = await prisma.user.findUnique({
        where: { emailHash: emailHash },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const flightEntries = await prisma.flightEntry.findMany({
        where: {
          userId: user.id,
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
  },
);

app.get(
  "/api/v1/flight_entry/:id",
  validate(flightEntryGetSchema, "params"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as unknown as FlightEntryGetParams;

      // Look up user by constant emailHash
      const user = await prisma.user.findUnique({
        where: { emailHash: emailHash },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const flightEntry = await prisma.flightEntry.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!flightEntry) {
        res.status(404).json({ error: "Flight entry not found" });
        return;
      }

      // Verify the flight entry belongs to the user with the correct hash
      if (flightEntry.user.emailHash !== emailHash) {
        res.status(403).json({ error: "Forbidden: Access denied to this flight entry" });
        return;
      }
      const { user: _, ...flightEntryWithoutUser } = flightEntry;

      res.json(flightEntryWithoutUser);
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

app.delete(
  "/api/v1/flight_entry/:id",
  validate(flightEntryGetSchema, "params"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as unknown as FlightEntryGetParams;

      // Look up user by their emailHash
      const user = await prisma.user.findUnique({
        where: { emailHash: emailHash },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // First fetch the entry to verify ownership
      const flightEntry = await prisma.flightEntry.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!flightEntry) {
        res.status(404).json({ error: "Flight entry not found" });
        return;
      }

      // Verify the flight entry belongs to the user with TEST_EMAIL_HASH
      if (flightEntry.user.emailHash !== emailHash) {
        res.status(403).json({ error: "Forbidden: Access denied to this flight entry" });
        return;
      }

      // Delete the entry after verification
      const deletedEntry = await prisma.flightEntry.delete({ where: { id } });

      res.json(deletedEntry);
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

app.patch(
  "/api/v1/flight_entry/:id",
  validate(flightEntryGetSchema, "params"),
  validate(flightEntryPatchSchema, "body"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as unknown as FlightEntryGetParams;
      const updates = req.body as unknown as FlightEntryPatchParams;

      // Look up user by constant emailHash
      const user = await prisma.user.findUnique({
        where: { emailHash: emailHash },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const flightEntry = await prisma.flightEntry.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!flightEntry) {
        res.status(404).json({ error: "Flight entry not found" });
        return;
      }

      if (flightEntry.user.emailHash !== emailHash) {
        res.status(403).json({ error: "Forbidden: Access denied to this flight entry" });
        return;
      }

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
  },
);

app.post(
  "/api/v1/flight_entry/",
  validate(flightEntryPostSchema, "body"),
  async (req: Request, res: Response) => {
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

      // Look up user by constant emailHash
      const user = await prisma.user.findUnique({
        where: { emailHash: emailHash },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Design Decision:
      // All the fields are optional except for date, src, dest and tail number
      // I think the requirements for what the frontend needs to show may change
      // so I'd rather have too many fields and a flexible API rather than too few.
      const flightEntry = await prisma.flightEntry.create({
        data: {
          userId: user.id,
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
  },
);

app.post(
  "/api/v1/user/",
  validate(userPostSchema, "body"),
  async (req: Request, res: Response) => {
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
  },
);

app.post(
  "/api/v1/verify/",
  validate(flightSchema, "body"),
  async (req: Request, res: Response) => {
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
  },
);

app.post(
  "/api/v1/ocr/",
  upload.single("image"),
  validate(ocrSchema, "body"),
  async (req: Request, res: Response) => {
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
  },
);

export { app, prisma };

if (require.main === module) {
  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
