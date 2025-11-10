import { PrismaClient, UploadStatus, FlightSource } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Command } from 'commander';

const prisma = new PrismaClient();

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

// Southern California training airports (where student pilots actually train)
const airports = [
  'KVNY', // Van Nuys - Very popular training airport
  'KBUR', // Burbank
  'KSNA', // John Wayne/Orange County
  'KFUL', // Fullerton - Major training airport
  'KCNO', // Chino - Lots of flight schools
  'KPOC', // Brackett Field - Popular training
  'KWHP', // Whiteman - Student pilot friendly
  'KSBD', // San Bernardino
  'KRAL', // Riverside
  'KCMA', // Camarillo - Great training airport
  'KOXR', // Oxnard
  'KSBA', // Santa Barbara
  'KCRQ', // Carlsbad/McClellan-Palomar
  'KMYF', // Montgomery-Gibbs (San Diego)
  'KSEE', // Gillespie Field (San Diego)
  'KSDM', // Brown Field (San Diego)
  'KTOA', // Torrance
  'KLGB', // Long Beach
];

const aircraftTypes = [
  { prefix: 'N', numbers: '172' }, // Cessna 172 - Most common trainer
  { prefix: 'N', numbers: '152' }, // Cessna 152 - Budget trainer
  { prefix: 'N', numbers: '182' }, // Cessna 182
  { prefix: 'N', numbers: 'Cherokee' }, // Piper Cherokee
  { prefix: 'N', numbers: 'Warrior' }, // Piper Warrior
];

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

function generateTailNumber(): string {
  const type = randomElement(aircraftTypes);
  // Format: N + 3-5 numbers + optional 1-2 letters
  // e.g., N12345, N172SP, N8294V
  const numDigits = randomInt(3, 5);
  let number = '';
  for (let i = 0; i < numDigits; i++) {
    number += randomInt(0, 9);
  }
  // 50% chance of adding suffix letters
  if (rng.next() > 0.5) {
    const letters = String.fromCharCode(65 + randomInt(0, 25)) +
      (rng.next() > 0.5 ? String.fromCharCode(65 + randomInt(0, 25)) : '');
    return `${type.prefix}${number}${letters}`;
  }
  return `${type.prefix}${number}`;
}

function generateFlightHours(): Decimal {
  // Student pilot training flights are typically 1.0 to 3.5 hours
  const hours = (rng.next() * 2.5 + 1.0).toFixed(1);
  return new Decimal(hours);
}

function generateDate(yearOffset: number = 0, monthOffset: number = 0): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - yearOffset);
  date.setMonth(date.getMonth() - monthOffset);
  date.setDate(randomInt(1, 28)); // Safe day range

  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function generateFilePath(pilotName: string, uploadNumber: number, source: FlightSource): string {
  const timestamp = Date.now();
  const sanitizedName = pilotName.replace(/\s+/g, '_').toLowerCase();
  return `uploads/${sanitizedName}/logbook_${uploadNumber}_${source.toLowerCase()}_${timestamp}.pdf`;
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

  // Check if data exists
  {
    const userCount = await prisma.user.count();
    const pilotCount = await prisma.pilot.count();
    const uploadCount = await prisma.logbookUpload.count();
    const flightCount = await prisma.flightEntry.count();

    const hasData = userCount > 0 || pilotCount > 0 || uploadCount > 0 || flightCount > 0;

    if (hasData && !force) {
      console.error('❌ Error: Database already contains data!');
      console.error('');
      console.error('📊 Current data:');
      console.error(`   Users: ${userCount}`);
      console.error(`   Pilots: ${pilotCount}`);
      console.error(`   Logbook Uploads: ${uploadCount}`);
      console.error(`   Flight Entries: ${flightCount}`);
      console.error('');
      console.error('To delete existing data and proceed with seeding, use the -f flag:');
      console.error('  npm run seed -- -f');
      process.exit(1);
    }

    if (hasData) {
      // Clear existing data
      console.log('🗑️  Clearing existing data...');
      await prisma.flightEntry.deleteMany();
      await prisma.logbookUpload.deleteMany();
      await prisma.pilot.deleteMany();
      await prisma.user.deleteMany();
    }
  }

  console.log('✨ Creating users and logbook data...\n');

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
      },
    });

    // Create pilot
    const pilot = await prisma.pilot.create({
      data: {
        userId: user.id,
        licenseNumber: generateLicenseNumber(),
      },
    });

    // Create 2 logbook uploads (1 OCR, 1 MANUAL)
    const sources: FlightSource[] = ['OCR', 'MANUAL'];

    for (let uploadIndex = 0; uploadIndex < 2; uploadIndex++) {
      const source = sources[uploadIndex];
      const uploadNumber = uploadIndex + 1;

      console.log(`  📄 Creating ${source} logbook upload ${uploadNumber}/2`);

      const upload = await prisma.logbookUpload.create({
        data: {
          pilotId: pilot.userId,
          filePath: generateFilePath(fullName, uploadNumber, source),
          status: UploadStatus.DONE,
          source: source,
          time: new Date(),
        },
      });

      // Create 5 flights for this upload
      const flightPromises = [];
      for (let flightIndex = 0; flightIndex < 5; flightIndex++) {
        const monthsAgo = uploadIndex * 6 + flightIndex; // Spread flights across time

        flightPromises.push(
          prisma.flightEntry.create({
            data: {
              pilotId: pilot.userId,
              uploadId: upload.id,
              departureAirfield: randomElement(airports),
              tailNumber: generateTailNumber(),
              depDate: generateDate(0, monthsAgo),
              hours: generateFlightHours(),
            },
          })
        );
      }

      await Promise.all(flightPromises);
      console.log(`    ✈️  Created 5 flight entries`);
    }

    console.log();
  }

  // Print summary
  const userCount = await prisma.user.count();
  const pilotCount = await prisma.pilot.count();
  const uploadCount = await prisma.logbookUpload.count();
  const flightCount = await prisma.flightEntry.count();

  console.log('✅ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Users: ${userCount}`);
  console.log(`   Pilots: ${pilotCount}`);
  console.log(`   Logbook Uploads: ${uploadCount}`);
  console.log(`   Flight Entries: ${flightCount}`);
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
