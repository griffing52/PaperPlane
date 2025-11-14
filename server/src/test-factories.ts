import { PrismaClient, FlightLog, User } from '@prisma/client';

const prisma = new PrismaClient();

type UserCleanupFunction = (() => Promise<void>) & { user: User };

export async function createTestUser(): Promise<UserCleanupFunction> {
  const d = Date.now();
  const user = await prisma.user.create({
    data: {
      email: `${d}@example.com`,
      name: 'Jebadiah',
      licenseNumber: `${d}`,
    },
  });

  const cleanup = async () => {
    await prisma.flightLog.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
  };

  return Object.assign(cleanup, { user });
}

type CleanupFunction = (() => Promise<void>) & { flightLog: FlightLog };

export async function createTestFlightLog(overrides: Partial<any> = {}): Promise<CleanupFunction> {
  const userCleanup = await createTestUser();

  const flightLog = await prisma.flightLog.create({
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

  return Object.assign(cleanup, { flightLog });
}
