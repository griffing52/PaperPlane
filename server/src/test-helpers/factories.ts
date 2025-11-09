import { testPrisma } from './setup';

/**
 * Create a test user with optional overrides
 */
export async function createTestUser(overrides: {
  id?: string;
  email?: string;
  name?: string;
} = {}) {
  const data: any = {
    email: overrides.email || `test-${Date.now()}@example.com`,
    name: overrides.name || 'Test User',
  };

  if (overrides.id) {
    data.id = overrides.id;
  }

  return await testPrisma.user.create({ data });
}

/**
 * Create a test pilot with optional overrides
 */
export async function createTestPilot(overrides: {
  userId?: string;
  licenseNumber?: string;
} = {}) {
  let userId = overrides.userId;

  // Create a user if userId not provided
  if (!userId) {
    const user = await createTestUser();
    userId = user.id;
  }

  return await testPrisma.pilot.create({
    data: {
      userId,
      licenseNumber: overrides.licenseNumber || `LIC-${Date.now()}`,
    },
    include: {
      user: true,
    },
  });
}

/**
 * Create a test logbook upload with optional overrides
 */
export async function createTestLogbookUpload(
  pilotId: string,
  overrides: {
    id?: string;
    filePath?: string;
    status?: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
    source?: 'OCR' | 'MANUAL';
  } = {}
) {
  const data: any = {
    pilotId,
    filePath: overrides.filePath || `/uploads/${Date.now()}.pdf`,
    status: overrides.status || 'DONE',
    source: overrides.source || 'MANUAL',
  };

  if (overrides.id) {
    data.id = overrides.id;
  }

  return await testPrisma.logbookUpload.create({ data });
}

/**
 * Create a test flight entry with optional overrides
 */
export async function createTestFlight(
  pilotId: string,
  overrides: {
    id?: string;
    uploadId?: string | null;
    departureAirfield?: string;
    tailNumber?: string;
    depDate?: string;
    hours?: number;
  } = {}
) {
  // First create a Flight record
  const tailNumber = overrides.tailNumber || 'N12345';
  const departureAirfield = overrides.departureAirfield || 'KJFK';
  const depDate = overrides.depDate || new Date().toISOString();

  const flight = await testPrisma.flight.create({
    data: {
      tailNumber,
      aircraftModel: 'Cessna 172',
      manufacturer: 'Cessna',
      originAirportIcao: departureAirfield,
      destinationAirportIcao: 'KLAX',
      departureTime: depDate,
      arrivalTime: new Date(new Date(depDate).getTime() + (overrides.hours || 2.5) * 3600000).toISOString(),
    },
  });

  const data: any = {
    pilotId,
    flightId: flight.id,
    uploadId: overrides.uploadId === undefined ? null : overrides.uploadId,
  };

  if (overrides.id) {
    data.id = overrides.id;
  }

  return await testPrisma.flightEntry.create({
    data,
    include: {
      pilot: {
        include: {
          user: true,
        },
      },
      upload: true,
      flight: true,
    },
  });
}
