import { PrismaClient, Flight } from '@prisma/client';

const prisma = new PrismaClient();

export async function verifyFlight(
  flight: Partial<Flight>,
  timeToleranceMinutes: number = 15
  // promise type to satisfy async JS rules
): Promise<Flight | null> {
  const exactFields: (keyof Flight)[] = [
    'tailNumber',
    'aircraftModel',
    'manufacturer',
    'originAirportIcao',
    'destinationAirportIcao',
  ];

  // to turn off the type checker since I know that the types are right
  let where: any = Object.fromEntries(
      exactFields
        .filter((field) => flight[field] != null)
        .map((field) => [field, flight[field]])
    );

  const timeFields: (keyof Flight)[] = ['departureTime', 'arrivalTime'];
  const toleranceMs = timeToleranceMinutes * 60 * 1000;

  for (const field of timeFields) {
    const timeValue = flight[field];
    
    if (timeValue == null) continue;

    // for the type checker
    if (timeValue instanceof Date) {
      where[field] = {
        gte: new Date(timeValue.getTime() - toleranceMs),
        lte: new Date(timeValue.getTime() + toleranceMs),
      };
    } else {
        throw new Error(`Expected ${field} to be Date but got ${timeValue}`);
    }
  }

  // if where is empty, then this will always return something
  // this is intended behavior
  const match = await prisma.flight.findFirst({
    where,
  });

  return match;
}
