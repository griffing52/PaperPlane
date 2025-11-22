import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { validate, flightEntryQuerySchema, flightEntryGetSchema, userPostSchema, ocrSchema, flightSchema, FlightEntryQueryParams, FlightEntryGetParams, UserPostBodyParams, FlightBodyParams } from './validation';
import { ocrImage } from './ocr';
import { verifyFlight } from './verify';

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (_req: Request, res: Response) => {
  try {
    res.json({ status: 'ok', message: 'Server is running' });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/v1/flight_entries/', validate(flightEntryQuerySchema, 'query'), async (req: Request, res: Response) => {
  try {
    const { userId, flightId } = req.query as unknown as FlightEntryQueryParams;
    const flightEntries = await prisma.flightEntry.findMany({
      where: {
        ...(userId != null && { userId }),
        ...(flightId != null && { flightId }),
      }
    });
    res.status(201).json(flightEntries);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/v1/flight_entries/:id', validate(flightEntryGetSchema, 'params'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as unknown as FlightEntryGetParams;
    const flightEntry = await prisma.flightEntry.findUnique({ where: { id } });
    if (!flightEntry) {
      res.status(404).json({ error: 'Flight entry not found' });
      return;
    }
    res.json(flightEntry);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/v1/flight_entries/:id', validate(flightEntryGetSchema, 'params'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as unknown as FlightEntryGetParams;

    let flightEntry;
    try {
      flightEntry = await prisma.flightEntry.delete({ where: { id } });
    } catch (error) {
      res.status(404).json({ error: 'Flight entry not found' });
      return;
    }

    res.json(flightEntry);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/v1/user/', validate(userPostSchema, 'body'), async (req: Request, res: Response) => {
  try {
    const { name, email, licenseNumber } = req.body as unknown as UserPostBodyParams;
    const flight = await prisma.user.create({
      data: {
        name,
        email,
        licenseNumber,
      }
    }
    );
    res.status(201).json(flight);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/v1/verify/', validate(flightSchema, 'body'), async (req: Request, res: Response) => {
  try {
    const flightData = req.body as unknown as FlightBodyParams;
    const verifiedFlight = await verifyFlight(flightData);
    res.json(verifiedFlight);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post(
  '/api/v1/ocr/',
  upload.single('image'),
  validate(ocrSchema, 'body'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image file provided' });
        return;
      }

      const ocrResult = await ocrImage(req.file.buffer);

      res.status(200).json(ocrResult);
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export { app, prisma };

if (require.main === module) {
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
