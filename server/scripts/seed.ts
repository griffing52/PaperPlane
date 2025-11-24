import { PrismaClient } from '@prisma/client';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// AI Disclosure by Bolun Thompson:
// This script was AI generated, but reviewed and looks to be good enough for now.
// The approximate prompt is below. I used Claude Code with Sonnet 4.5 with thinking enabled.
// Note: I iterated over this multiple times as my requirements changed, but I only include the
// approximate final prompt.
//
// Prompt 1:
// Ultrathink. Write clean and elegant code.
// Write a script to generate fake pilot data in server/scripts/seed.ts.
// Add a script to the package.json to run it.
// Use data/flight_data.json to put in the flight data.
// Seed randomness.
//
// Prompt 2:
// Add a clean command line interface using a argument parsing library
// Take a  "-f" flag to force overwrite DB data.

// TypeScript interface for real flight data
interface RealFlightData {
  icao24: string;
  tail_number: string;
  aircraft_model: string;
  manufacturer: string | null;
  origin_airport_icao: string;
  destination_airport_icao: string | null;
  departure_time: string;
  arrival_time: string;
  user_id: number;
  flight_number: number;
}

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear Congruential Generator
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
}

// Initialize with a fixed seed for reproducibility
const rng = new SeededRandom(42);

// Realistic data pools
const firstNames = ['James', 'Sarah', 'Michael', 'Emily', 'Robert', 'Jennifer', 'David', 'Lisa', 'John', 'Amanda'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

// Helper functions
function randomElement<T>(array: T[]): T {
  return array[Math.floor(rng.next() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(rng.next() * (max - min + 1)) + min;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(domains)}`;
}

function generateLicenseNumber(): string {
  return `PPL-${randomInt(100000, 999999)}`;
}

function randomDecimal(min: number, max: number, precision: number = 1): number {
  const value = rng.next() * (max - min) + min;
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

// Generate plausible flight time data based on actual flight duration
function generateFlightTimes(departureTime: Date, arrivalTime: Date) {
  // Calculate actual flight duration in hours
  const durationMs = arrivalTime.getTime() - departureTime.getTime();
  const totalFlightTime = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal

  // All pilots are student pilots - mix of dual received and solo
  let soloTime = 0;
  let dualReceivedTime = 0;

  // Student pilot - mix of dual received and solo (60% dual, 40% solo)
  if (rng.next() < 0.6) {
    dualReceivedTime = totalFlightTime;
  } else {
    soloTime = totalFlightTime;
  }

  // Special conditions (can overlap with above times)
  // Cross country: ~40% of flights, must be >50nm
  const crossCountryTime = rng.next() < 0.4 ? totalFlightTime : 0;

  // Night time: ~20% of flights
  const nightTime = rng.next() < 0.2 ? randomDecimal(0, totalFlightTime, 1) : 0;

  // Actual instrument: ~15% of flights (when conditions are IMC)
  const actualInstrumentTime = rng.next() < 0.15 ? randomDecimal(0, totalFlightTime * 0.8, 1) : 0;

  // Simulated instrument: ~40% of flights (student pilots training)
  const simulatedInstrumentTime = rng.next() < 0.4 ? randomDecimal(0, totalFlightTime * 0.9, 1) : 0;

  return {
    totalFlightTime,
    soloTime,
    dualReceivedTime,
    crossCountryTime,
    nightTime,
    actualInstrumentTime,
    simulatedInstrumentTime,
  };
}

// Set up CLI with commander
const program = new Command();

program
  .name('seed')
  .description('Seeds the database with dummy data for development purposes.\nBy default, the script will refuse to run if data already exists in the database.')
  .option('-f, --force', 'Force deletion of existing data before seeding')
  .addHelpText('after', `
Examples:
  npm run seed           # Run seed (fails if data exists)
  npm run seed -- -f     # Force seed (deletes existing data)
  `)
  .parse(process.argv);

const options = program.opts();

// Main seed function
async function seed(force: boolean) {
  console.log('🌱 Starting database seed...');
  console.log('🎲 Using seed value: 42 (change SeededRandom(42) to get different data)');

  // Load real flight data
  const realFlightsPath = path.join(__dirname, '../../data/real_flights.json');
  const realFlightsData: RealFlightData[] = JSON.parse(fs.readFileSync(realFlightsPath, 'utf-8'));
  console.log(`📁 Loaded ${realFlightsData.length} real flights from JSON\n`);

  // Check if data exists
  {
    const userCount = await prisma.user.count();
    const flightCount = await prisma.flightEntry.count();
    const realFlightCount = await prisma.flight.count();

    const hasData = userCount > 0 || flightCount > 0 || realFlightCount > 0;

    if (hasData && !force) {
      console.error('❌ Error: Database already contains data!');
      console.error('');
      console.error('📊 Current data:');
      console.error(`   Users: ${userCount}`);
      console.error(`   Flight Entries: ${flightCount}`);
      console.error(`   Flights: ${realFlightCount}`);
      console.error('');
      console.error('To delete existing data and proceed with seeding, use the -f flag:');
      console.error('  npm run seed -- -f');
      process.exit(1);
    }

    if (hasData) {
      // Clear existing data
      console.log('🗑️  Clearing existing data...');
      await prisma.flightEntry.deleteMany();
      await prisma.flight.deleteMany();
      await prisma.user.deleteMany();
    }
  }

  console.log('✨ Creating users...\n');

  const users = [];
  for (let i = 0; i < 5; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const email = generateEmail(firstName, lastName);

    console.log(`👤 Creating user ${i + 1}/5: ${fullName}`);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: fullName,
        licenseNumber: generateLicenseNumber(),
      },
    });

    users.push(user);
    console.log();
  }

  console.log('✈️  Creating real flight data...\n');

  // Create Flight records from real data
  const createdFlights = [];
  for (const flightData of realFlightsData) {
    // Use placeholders for missing data
    const manufacturer = flightData.manufacturer || 'Unknown';
    const destinationAirport = flightData.destination_airport_icao || flightData.origin_airport_icao;

    const flight = await prisma.flight.create({
      data: {
        tailNumber: flightData.tail_number.trim(),
        aircraftModel: flightData.aircraft_model,
        manufacturer: manufacturer,
        originAirportIcao: flightData.origin_airport_icao,
        destinationAirportIcao: destinationAirport,
        departureTime: new Date(flightData.departure_time),
        arrivalTime: new Date(flightData.arrival_time),
      },
    });

    createdFlights.push({ flight, originalPilotId: flightData.user_id });
  }

  console.log(`  ✅ Created ${createdFlights.length} Flight records\n`);

  console.log('🔗 Creating flight entries (linking flights to users)...\n');

  // Create FlightEntry records, mapping JSON user_ids to our 5 users
  for (const { flight, originalPilotId } of createdFlights) {
    // Map original user_id (1-13) to one of our 5 users (0-4)
    const userIndex = (originalPilotId - 1) % 5;
    const user = users[userIndex];

    // Generate plausible flight times
    const flightTimes = generateFlightTimes(flight.departureTime, flight.arrivalTime);

    await prisma.flightEntry.create({
      data: {
        flightId: flight.id,
        userId: user.id,
        totalFlightTime: flightTimes.totalFlightTime,
        soloTime: flightTimes.soloTime,
        dualReceivedTime: flightTimes.dualReceivedTime,
        crossCountryTime: flightTimes.crossCountryTime,
        nightTime: flightTimes.nightTime,
        actualInstrumentTime: flightTimes.actualInstrumentTime,
        simulatedInstrumentTime: flightTimes.simulatedInstrumentTime,
      },
    });
  }

  console.log(`  ✅ Created ${createdFlights.length} FlightEntry records\n`);

  // Print summary
  const userCount = await prisma.user.count();
  const flightCount = await prisma.flight.count();
  const flightEntryCount = await prisma.flightEntry.count();

  console.log('✅ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Users: ${userCount}`);
  console.log(`   Flights: ${flightCount}`);
  console.log(`   Flight Entries: ${flightEntryCount}`);
}

// Run the seed
seed(options.force)
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
