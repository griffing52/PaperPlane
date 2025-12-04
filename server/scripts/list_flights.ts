import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Script to list the 20 most recent archived flights in the database -- used for testing purposes

async function main() {
  const flights = await prisma.flight.findMany({
    orderBy: {
      departureTime: 'desc',
    },
    take: 20,
  });

  console.log("--- Archived Flights (Top 20) ---");
  flights.forEach(f => {
    console.log(`Flight ID: ${f.id}`);
    console.log(`  Tail: ${f.tailNumber}`);
    console.log(`  Route: ${f.originAirportIcao} -> ${f.destinationAirportIcao}`);
    console.log(`  Departure: ${f.departureTime.toISOString()}`);
    console.log(`  Arrival:   ${f.arrivalTime.toISOString()}`);
    console.log("-----------------------------------");
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
