import { createUser } from "@/server/src/controllers/UserController";
import { PrismaClient, FlightEntry, User, Flight } from "@prisma/client";

const prisma = new PrismaClient();

// Constant emailHash for testing (SHA-256 hex of michael.smith@outlook.com)
const TEST_EMAIL_HASH =
  "1c61d3af9e95de4b161dc5c7d5d7e0cbc6de90f884defcfe6d49a5e8bce62806";

type FlightCleanupFunction = (() => Promise<void>) & { flight: Flight };

export async function createTestFlight(
  overrides: Partial<Flight> = {},
): Promise<FlightCleanupFunction> {
  const flight = await prisma.flight.create({
    data: {
      tailNumber: "N12345",
      aircraftModel: "C172",
      manufacturer: "Cessna",
      originAirportIcao: "KLAX",
      destinationAirportIcao: "KSFO",
      departureTime: new Date("2023-01-01T10:00:00Z"),
      arrivalTime: new Date("2023-01-01T12:00:00Z"),
      ...overrides,
    },
  });

  const cleanup = async () => {
    await prisma.flight.delete({ where: { id: flight.id } });
  };

  return Object.assign(cleanup, { flight });
}

type UserCleanupFunction = (() => Promise<void>) & { user: User };

export async function createTestUser(): Promise<UserCleanupFunction> {
  const d = Date.now();
  const email = `${d}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      emailHash: `hash_${email}`,
      name: "Jebadiah",
    },
  });

  const cleanup = async () => {
    await prisma.flightEntry.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
  };

  return Object.assign(cleanup, { user });
}

// Create or get the test user with constant emailHash (michael.smith@outlook.com)
export async function getOrCreateMichaelSmithUser(): Promise<UserCleanupFunction> {
  let user = await prisma.user.findUnique({
    where: { emailHash: TEST_EMAIL_HASH },
  });

  const wasCreated = !user;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "michael.smith@outlook.com",
        emailHash: TEST_EMAIL_HASH,
        name: "Michael Smith",
      },
    });
  }

  const cleanup = async () => {
    // Only delete flight entries, not the user (we assume it exists in the DB for testing)
    await prisma.flightEntry.deleteMany({ where: { userId: user!.id } });
    // Only delete the user if we created it in this test
    if (wasCreated) {
      await prisma.user.deleteMany({ where: { id: user!.id } });
    }
  };

  return Object.assign(cleanup, { user });
}

type CleanupFunction = (() => Promise<void>) & { flightEntry: FlightEntry };

export async function createTestFlightEntry(
  overrides: Partial<any> = {},
): Promise<CleanupFunction> {
  const userCleanup = await createTestUser();

  const flightEntry = await prisma.flightEntry.create({
    data: {
      userId: userCleanup.user.id,
      date: new Date("2023-01-01"),
      tailNumber: "N12345",
      srcIcao: "KLAX",
      destIcao: "KSFO",
      route: "KLAX KSMO KSFO",
      totalFlightTime: 1.5,
      picTime: 1.5,
      dualReceivedTime: 0,
      crossCountry: true,
      night: false,
      solo: false,
      instrumentTime: 0,
      dayLandings: 1,
      nightLandings: 0,
      remarks: "Test flight",
      ...overrides,
    },
  });

  const cleanup = async () => {
    await userCleanup();
  };

  return Object.assign(cleanup, { flightEntry });
}

// Create a test flight entry for the Michael Smith user (with constant emailHash)
export async function createTestFlightEntryForMichaelSmith(
  overrides: Partial<any> = {},
): Promise<CleanupFunction> {
  const userCleanup = await getOrCreateMichaelSmithUser();

  const flightEntry = await prisma.flightEntry.create({
    data: {
      userId: userCleanup.user.id,
      date: new Date("2023-01-01"),
      tailNumber: "N12345",
      srcIcao: "KLAX",
      destIcao: "KSFO",
      route: "KLAX KSMO KSFO",
      totalFlightTime: 1.5,
      picTime: 1.5,
      dualReceivedTime: 0,
      crossCountry: true,
      night: false,
      solo: false,
      instrumentTime: 0,
      dayLandings: 1,
      nightLandings: 0,
      remarks: "Test flight",
      ...overrides,
    },
  });

  const cleanup = async () => {
    await userCleanup();
  };

  return Object.assign(cleanup, { flightEntry });
}
