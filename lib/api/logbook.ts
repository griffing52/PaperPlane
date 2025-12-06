import { API_BASE_URL, OCR_API_BASE_URL } from "../config";
import { LogEntry } from "@/types/logbook";
import { ApiError, ValidationError } from "./errors";

const genHeaders = (idToken: string) => {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${idToken}`
  }
}

const formatErrorMessage = (errorResponse: any): { message: string; errors: ValidationError[] } => {
  // Check if response has validation errors array
  if (errorResponse.errors && Array.isArray(errorResponse.errors)) {
    const errorMessages = errorResponse.errors
      .map((err: ValidationError) => `${err.field}: ${err.message}`)
      .join("\n");
    return {
      message: errorMessages,
      errors: errorResponse.errors
    };
  }

  // Fallback to error field or generic message
  return {
    message: errorResponse.error || errorResponse.detail || "An unknown error occurred",
    errors: []
  };
};

const parseLogEntry = (data: any): LogEntry => {
  // we use this instead of Json.parse for more flexiblity
  return {
    id: data.id,
    date: data.date ? new Date(data.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    tailNumber: data.tailNumber || "",
    srcIcao: data.srcIcao || "",
    destIcao: data.destIcao || "",
    route: data.route?.replace(" ", " \u2192 "),
    totalFlightTime: parseFloat(data.totalFlightTime || data.totalTime || "0"),
    picTime: parseFloat(data.picTime || "0"),
    dualReceivedTime: parseFloat(data.dualReceivedTime || "0"),
    instrumentTime: parseFloat(data.instrumentTime || "0"),
    crossCountry: !!data.crossCountry,
    night: !!data.night || (parseFloat(data.nightTime || "0") > 0),
    solo: data.solo,
    dayLandings: parseInt(data.dayLandings || "0", 10),
    nightLandings: parseInt(data.nightLandings || "0", 10),
    remarks: data.remarks || null,
  };
};

export const uploadLogbookFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const ocrBase = String(OCR_API_BASE_URL).replace(/\/$/, "");
  const response = await fetch(`${ocrBase}/ocr/process`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Upload failed with an unknown error.');
  }

  return response.json();
};

// NOTE: michael.smith@outlook.com is a valid email address for testing
export const fetchLogs = async (idToken: string): Promise<Array<LogEntry>> => {
  const apiBase = String(API_BASE_URL).replace(/\/$/, "");
  const response = await fetch(`${apiBase}/api/v1/flight_entry`, {
    method: "GET",
    headers: genHeaders(idToken),
  });
  const data = await response.json();

  if (!response.ok) {
    const { message, errors } = formatErrorMessage(data);
    throw new ApiError(message, errors);
  }

  if (!Array.isArray(data)) {
    throw new Error("Invalid response format: expected an array of logs");
  }

  return data.map(parseLogEntry);
};

// NOTE: if method == PATCH, id must be provided
// if method == POST, id must not be provided
const saveFlightEntry = async (
  method: "POST" | "PATCH",
  entry: Partial<Omit<LogEntry, "id">>,
  idToken: string,
  id?: string,
) => {
  const url = id
    ? `${String(API_BASE_URL).replace(/\/$/, "")}/api/v1/flight_entry/${id}`
    : `${String(API_BASE_URL).replace(/\/$/, "")}/api/v1/flight_entry`;

  const response = await fetch(url, {
    method,
    headers: genHeaders(idToken),
    body: JSON.stringify({
      date: (entry.date ?? "").replaceAll("-", "/"),
      tailNumber: entry.tailNumber ?? "",
      srcIcao: entry.srcIcao,
      destIcao: entry.destIcao,
      route: entry.route,
      totalFlightTime: entry.totalFlightTime ?? 0,
      picTime: entry.picTime ?? 0,
      dualReceivedTime: entry.dualReceivedTime ?? 0,
      crossCountry: entry.crossCountry ?? false,
      night: entry.night ?? false,
      solo: entry.solo ?? false,
      instrumentTime: entry.instrumentTime ?? 0,
      dayLandings: entry.dayLandings ?? 0,
      nightLandings: entry.nightLandings ?? 0,
      remarks: entry.remarks ?? "",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    const { message, errors } = formatErrorMessage(error);
    throw new ApiError(message, errors);
  }

  return response.json();
};

export const createFlightEntry = (entry: Omit<LogEntry, "id">, idToken: string) => saveFlightEntry("POST", entry, idToken);

export const updateFlightEntry = (entry: LogEntry, idToken: string) =>
  saveFlightEntry("PATCH", entry, idToken, entry.id);

export const deleteFlightEntry = async (id: string, idToken: string) => {
  const apiBase = String(API_BASE_URL).replace(/\/$/, "");
  const response = await fetch(`${apiBase}/api/v1/flight_entry/${id}`, {
    method: "DELETE",
    headers: genHeaders(idToken),
  });

  if (!response.ok) {
    const error = await response.json();
    const { message, errors } = formatErrorMessage(error);
    throw new ApiError(message, errors);
  }

  return response.json();
};

export const verifyFlightEntry = async (entry: LogEntry, idToken: string) => {
  // Create a midday date for the flight to avoid timezone issues
  const departureTime = new Date(entry.date);
  departureTime.setUTCHours(12, 0, 0, 0);

  // Calculate arrival time based on duration (hours -> ms)
  const durationMs = entry.totalFlightTime * 60 * 60 * 1000;
  const arrivalTime = new Date(departureTime.getTime() + durationMs);

  const apiBase = String(API_BASE_URL).replace(/\/$/, "");
  const response = await fetch(`${apiBase}/api/v1/verify/`, {
    method: "POST",
    headers: genHeaders(idToken),
    body: JSON.stringify({
      tailNumber: entry.tailNumber,
      originAirportIcao: entry.srcIcao,
      destinationAirportIcao: entry.destIcao,
      departureTime: departureTime.toISOString(),
      arrivalTime: arrivalTime.toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    const { message, errors } = formatErrorMessage(error);
    throw new ApiError(message, errors);
  }

  return response.json();
};

export { parseLogEntry };
