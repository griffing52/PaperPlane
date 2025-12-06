import { PrismaClient, Flight } from "@prisma/client";

const prisma = new PrismaClient();

export async function verifyFlight(
  id: string | undefined,
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
  if (id) {
    const flightEntry = await prisma.flightEntry.findFirst({
      where: { id }, include: { flight: true }
    });
    if (flightEntry?.flightId) {
      return flightEntry.flight
    }
  }

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

  let foundCandidate = null;

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
        foundCandidate = candidate;
        break;
      }
    }
  } else if (candidates.length > 0) {
    foundCandidate = candidates[0];
  }

  if (id && foundCandidate) {
    await prisma.flightEntry.update({
      where: { id },
      data: { flightId: foundCandidate.id }
    });
  }

  return foundCandidate;
}
