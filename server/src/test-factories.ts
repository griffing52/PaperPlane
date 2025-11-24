import { PrismaClient, FlightEntry, User, Flight } from "@prisma/client";

const prisma = new PrismaClient();

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
  const user = await prisma.user.create({
    data: {
      email: `${d}@example.com`,
      name: "Jebadiah",
      licenseNumber: `${d}`,
    },
  });

  const cleanup = async () => {
    await prisma.flightEntry.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
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
      totalFlightTime: 1.5,
      soloTime: 0,
      dualReceivedTime: 1.5,
      crossCountryTime: 1.5,
      nightTime: 0,
      actualInstrumentTime: 0,
      simulatedInstrumentTime: 0,
      ...overrides,
    },
  });

  const cleanup = async () => {
    await userCleanup();
  };

  return Object.assign(cleanup, { flightEntry });
}
