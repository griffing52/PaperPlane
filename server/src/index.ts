import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { validate, flightLogQuerySchema, flightLogGetSchema, userPostSchema, logbookPostSchema, FlightLogQueryParams, FlightLogGetParams, UserPostBodyParams, LogbookPostBodyParams } from './validation';
import { ocrImage, LogbookOCRResult } from './ocr';

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

// Hack: prisma complains if we pass in an object with too many fields
// so we trim them here
function mapOcrToFlightData(ocrResult: LogbookOCRResult) {
  const {
    tailNumber,
    aircraftModel,
    manufacturer,
    originAirportIcao,
    destinationAirportIcao,
    departureTime,
    arrivalTime,
  } = ocrResult;

  return {
    tailNumber,
    aircraftModel,
    manufacturer,
    originAirportIcao,
    destinationAirportIcao,
    departureTime,
    arrivalTime,
  };
}

function mapOcrToFlightLogMetrics(ocrResult: LogbookOCRResult) {
  const {
    totalFlightTime,
    soloTime,
    dualReceivedTime,
    crossCountryTime,
    nightTime,
    actualInstrumentTime,
    simulatedInstrumentTime,
  } = ocrResult;

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


app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  try {
    res.json({ status: 'ok', message: 'Server is running' });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/flight_logs/', validate(flightLogQuerySchema, 'query'), async (req: Request, res: Response) => {
  try {
    const { userId, flightId } = req.query as unknown as FlightLogQueryParams;
    const flight = await prisma.flightLog.findMany({
      where: {
        ...(userId != null && { userId }),
        ...(flightId != null && { flightId }),
      }
    });
    res.status(201).json(flight);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/flight_logs/:id', validate(flightLogGetSchema, 'params'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as unknown as FlightLogGetParams;
    const flight = await prisma.flightLog.findUnique({ where: { id } });
    if (!flight) {
      res.status(404).json({ error: 'Flight log not found' });
      return;
    }
    res.json(flight);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/flight_logs/:id', validate(flightLogGetSchema, 'params'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as unknown as FlightLogGetParams;

    let flight;
    try {
      flight = await prisma.flightLog.delete({ where: { id } });
    } catch (error) {
      res.status(404).json({ error: 'Flight log not found' });
      return;
    }

    res.json(flight);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/user/', validate(userPostSchema, 'body'), async (req: Request, res: Response) => {
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

app.post(
  '/logbook/',
  upload.single('image'),
  validate(logbookPostSchema, 'body'),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.body as LogbookPostBodyParams;

      if (!req.file) {
        res.status(400).json({ error: 'No image file provided' });
        return;
      }

      const ocrResult = await ocrImage(req.file.buffer);

      const flightLog = await prisma.$transaction(async (tx) => {
        const flight = await tx.flight.create({
          data: mapOcrToFlightData(ocrResult),
        });

        return tx.flightLog.create({
          data: {
            userId,
            flightId: flight.id,
            ...mapOcrToFlightLogMetrics(ocrResult),
          },
        });
      });

      res.status(201).json({
        success: true,
        data: flightLog,
        metadata: {
          confidence: ocrResult.confidence,
        },
      });
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
