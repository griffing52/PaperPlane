import { PrismaClient, FlightLog } from '@prisma/client';

const prisma = new PrismaClient();

export async function createTestUser() {
  const d = Date.now();
  return await prisma.user.create({
    data: {
      email: `${d}@example.com`,
      name: 'Jebadiah',
      licenseNumber: `${d}`,
    },
  });
}

type CleanupFunction = (() => Promise<void>) & { flightLog: FlightLog };

export async function createTestFlightLog(overrides: Partial<any> = {}): Promise<CleanupFunction> {
  const user = await createTestUser();

  const flightLog = await prisma.flightLog.create({
    data: {
      userId: user.id,
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
    await prisma.flightLog.deleteMany({ where: { id: flightLog.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
  };

  return Object.assign(cleanup, { flightLog });
}
