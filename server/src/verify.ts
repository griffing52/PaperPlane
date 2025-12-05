import { PrismaClient, Flight } from "@prisma/client";

const prisma = new PrismaClient();

export async function verifyFlight(
  flight: Partial<Flight>,
  timeToleranceMinutes: number = 15,
  // promise type to satisfy async JS rules
): Promise<Flight | null> {
  const exactFields: (keyof Flight)[] = [
    "tailNumber",
    "aircraftModel",
    "manufacturer",
    "originAirportIcao",
    "destinationAirportIcao",
  ];

  // to turn off the type checker since I know that the types are right
  let where: any = Object.fromEntries(
    exactFields
      .filter((field) => flight[field] != null)
      .map((field) => [field, flight[field]]),
  );

  // Check if the flight happened on the same day
  if (flight.departureTime) {
    const startOfDay = new Date(flight.departureTime);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(flight.departureTime);
    endOfDay.setUTCHours(23, 59, 59, 999);

    where.departureTime = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  const candidates = await prisma.flight.findMany({
    where,
  });

  // Check if the duration is within the tolerance
  if (flight.departureTime && flight.arrivalTime) {
    const targetDuration =
      flight.arrivalTime.getTime() - flight.departureTime.getTime();
    const toleranceMs = timeToleranceMinutes * 60 * 1000;

    for (const candidate of candidates) {
      const candidateDuration =
        candidate.arrivalTime.getTime() - candidate.departureTime.getTime();

      if (Math.abs(candidateDuration - targetDuration) <= toleranceMs) {
        return candidate;
      }
    }
  } else if (candidates.length > 0) {
    return candidates[0];
  }

  return null;
}
