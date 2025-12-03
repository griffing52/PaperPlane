import { API_BASE_URL, OCR_API_BASE_URL } from "../config";
import { LogEntry } from "@/types/logbook";

const genHeaders = (idToken: string) => {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${idToken}`
  }
}

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

  const response = await fetch(`http://${OCR_API_BASE_URL}/ocr/process`, {
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
  const response = await fetch(`http://${API_BASE_URL}/api/v1/flight_entry`, {
    method: "GET",
    headers: genHeaders(idToken),
  });
  const data = await response.json();
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
    ? `http://${API_BASE_URL}/api/v1/flight_entry/${id}`
    : `http://${API_BASE_URL}/api/v1/flight_entry`;

  const response = await fetch(url, {
    method,
    headers: genHeaders(idToken),
    body: JSON.stringify({
      date: entry.date,
      tailNumber: entry.tailNumber,
      srcIcao: entry.srcIcao,
      destIcao: entry.destIcao,
      route: entry.route,
      totalFlightTime: entry.totalFlightTime,
      picTime: entry.picTime,
      dualReceivedTime: entry.dualReceivedTime,
      crossCountry: entry.crossCountry,
      night: entry.night,
      solo: entry.solo,
      instrumentTime: entry.instrumentTime,
      dayLandings: entry.dayLandings,
      nightLandings: entry.nightLandings,
      remarks: entry.remarks,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to ${method === "POST" ? "create" : "update"} flight entry`);
  }

  return response.json();
};

export const createFlightEntry = (entry: Omit<LogEntry, "id">, idToken: string) => saveFlightEntry("POST", entry, idToken);

export const updateFlightEntry = (entry: LogEntry, idToken: string) =>
  saveFlightEntry("PATCH", entry, idToken, entry.id);

export const deleteFlightEntry = async (id: string, idToken: string) => {
  const response = await fetch(`http://${API_BASE_URL}/api/v1/flight_entry/${id}`, {
    method: "DELETE",
    headers: genHeaders(idToken),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete flight entry");
  }

  return response.json();
};

export { parseLogEntry };
