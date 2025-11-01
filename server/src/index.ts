import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Flight Routes

// POST /api/flights - Create a new flight entry
app.post('/api/flights', async (req: Request, res: Response) => {
  try {
    const { pilotId, uploadId, departureAirfield, tailNumber, depDate, hours } = req.body;

    const flight = await prisma.flightEntry.create({
      data: {
        pilotId,
        uploadId: uploadId || null,
        departureAirfield,
        tailNumber,
        depDate,
        hours,
      },
      include: {
        pilot: {
          include: {
            user: true,
          },
        },
        upload: true,
      },
    });

    res.status(201).json(flight);
  } catch (error) {
    console.error('Error creating flight:', error);
    res.status(500).json({ error: 'Failed to create flight entry' });
  }
});

// GET /api/flights/:id - Get a single flight by ID
app.get('/api/flights/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const flight = await prisma.flightEntry.findUnique({
      where: { id },
      include: {
        pilot: {
          include: {
            user: true,
          },
        },
        upload: true,
      },
    });

    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    res.json(flight);
  } catch (error) {
    console.error('Error fetching flight:', error);
    res.status(500).json({ error: 'Failed to fetch flight' });
  }
});

// GET /api/flights - Get all flights, optionally filtered by pilotId
app.get('/api/flights', async (req: Request, res: Response) => {
  try {
    const { pilotId } = req.query;

    const flights = await prisma.flightEntry.findMany({
      where: pilotId ? { pilotId: pilotId as string } : undefined,
      include: {
        pilot: {
          include: {
            user: true,
          },
        },
        upload: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(flights);
  } catch (error) {
    console.error('Error fetching flights:', error);
    res.status(500).json({ error: 'Failed to fetch flights' });
  }
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
