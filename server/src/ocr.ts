// Can be modified

export interface LogbookOCRResult {
  tailNumber: string;
  aircraftModel: string;
  manufacturer: string;

  originAirportIcao: string;
  destinationAirportIcao: string;

  departureTime: Date;
  arrivalTime: Date;

  totalFlightTime: number;
  soloTime: number;
  dualReceivedTime: number;

  crossCountryTime: number;
  nightTime: number;
  actualInstrumentTime: number;
  simulatedInstrumentTime: number;

  confidence?: number;
  rawText?: string;
}

export async function ocrImage(imageBuffer: Buffer): Promise<LogbookOCRResult> {
  // Stub data
  return {
    tailNumber: 'N12345',
    aircraftModel: 'Cessna 172',
    manufacturer: 'Cessna',
    originAirportIcao: 'KSFO',
    destinationAirportIcao: 'KLAX',
    departureTime: new Date('2024-01-15T10:00:00Z'),
    arrivalTime: new Date('2024-01-15T11:30:00Z'),
    totalFlightTime: 1.5,
    soloTime: 0,
    dualReceivedTime: 1.5,
    crossCountryTime: 1.5,
    nightTime: 0,
    actualInstrumentTime: 0,
    simulatedInstrumentTime: 0.5,
    confidence: 0.85,
    rawText: 'Mock OCR output - replace with actual implementation',
  };
}
