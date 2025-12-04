import { Request, Response, NextFunction } from "express";
import { prisma, firebaseAuth, logger } from "../config";

const hashString = async (email: string): Promise<string> => {
  const byteHash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(email),
  );
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#examples
  const hashArray = Array.from(new Uint8Array(byteHash)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
};

type AuthData = {
  email: string;
  emailHash: string;
  name: string;
};

async function verifyFirebaseToken(idToken: string): Promise<AuthData | null> {
  const decodedToken = await firebaseAuth.verifyIdToken(idToken);
  const { email, name } = decodedToken;

  if (!email) {
    return null;
  }
  const emailHash = await hashString(email);
  return {
    email,
    emailHash,
    name: name || email.split("@")[0], // Default name if missing
  };
}

// TODO: Move this to a final report. This isn't relavant anymore because
// I've manually changed the arcitecture. However, this helped me change it!

// AI Disclosure by Bolun Thompson:
// I used Claude Code with Sonnet 4.5, to refactor the following endpoints to take a constant emailHash
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
//
// NOTE: The above happened before I'd refactored everything into middlware. If I'd done that already,
// it'd been easier to have done everything manually, since the auth would be DRY.

export const getAuthData = async (
  authHeader: string,
): Promise<AuthData | null> => {
  // Bearer indicates that we're taking a JWT token
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  // Regex could be used but there's no need; this is simple
  const token = authHeader.split("Bearer ")[1];

  const authData = await verifyFirebaseToken(token);
  return authData;
};

// Lookup the user in the database based on the Firebase Authorization Header
export const requireUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }
  const authData = await getAuthData(authHeader);

  if (!authData) {
    res.status(401).json({ error: "Invalid auth token" });
    return;
  }

  const { emailHash, email, name } = authData;

  // for privacy we only store email hashes in the database
  // Auto-create user if they don't exist (JIT provisioning)
  let user = await prisma.user.findUnique({
    where: { emailHash },
  });

  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          email,
          emailHash,
          name,
        },
      });
      logger.info(`Created new user for ${email}`);
    } catch (error) {
      logger.error(error, `Failed to create user ${email}:`);
      res.status(500).json({ error: "Failed to create user account" });
      return;
    }
  }

  req.user = user;
  next();
};

// Verify that requested flight entry is associated with the user
export const verifyFlightEntryOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized: User not authenticated" });
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

  if (flightEntry.user.emailHash !== req.user.emailHash) {
    res
      .status(403)
      .json({ error: "Forbidden: Access denied to this flight entry" });
    return;
  }

  req.flightEntry = flightEntry;
  next();
};
