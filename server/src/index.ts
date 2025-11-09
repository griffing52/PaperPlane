import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import {
  validate,
  CreateFlightSchema,
  FlightIdParamSchema,
  FlightsQuerySchema,
  CreateLogbookSchema,
  LogbookIdParamSchema,
  CreateFlightInput,
  FlightIdParam,
  FlightsQuery,
  CreateLogbookInput,
  LogbookIdParam
} from './validation';

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

// GET /api/flights/:id - Get a single flight by ID
app.get('/api/flights/:id', validate(FlightIdParamSchema, 'params'), async (req: Request<FlightIdParam>, res: Response) => {
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
        flight: true,
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
app.get('/api/flights', validate(FlightsQuerySchema, 'query'), async (req: Request<{}, {}, {}, FlightsQuery>, res: Response) => {
  try {
    const { pilotId } = req.query;

    const flights = await prisma.flightEntry.findMany({
      where: pilotId ? { pilotId } : undefined,
      include: {
        pilot: {
          include: {
            user: true,
          },
        },
        upload: true,
        flight: true,
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

// Logbook Routes

// GET /api/logbooks/:id - Get a single logbook by ID
app.get('/api/logbooks/:id', validate(LogbookIdParamSchema, 'params'), async (req: Request<LogbookIdParam>, res: Response) => {
  try {
    const { id } = req.params;

    const logbook = await prisma.logbookUpload.findUnique({
      where: { id },
      include: {
        pilot: {
          include: {
            user: true,
          },
        },
        flights: true,
      },
    });

    if (!logbook) {
      return res.status(404).json({ error: 'Logbook not found' });
    }

    res.json(logbook);
  } catch (error) {
    console.error('Error fetching logbook:', error);
    res.status(500).json({ error: 'Failed to fetch logbook' });
  }
});

// Export app for testing
export { app, prisma };

// Only start server if this file is run directly
if (require.main === module) {
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
