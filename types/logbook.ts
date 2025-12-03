export type LogEntry = {
  id?: string;
  date: string; // YYYY-MM-DD
  tailNumber: string;
  srcIcao: string;
  destIcao: string;
  route: string | null;
  totalFlightTime: number;
  picTime: number;
  dualReceivedTime: number;
  instrumentTime: number;
  crossCountry: boolean;
  night: boolean;
  solo: boolean;
  dayLandings: number;
  nightLandings: number;
  remarks: string | null;
};
