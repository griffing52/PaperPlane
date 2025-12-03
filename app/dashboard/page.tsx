"use client";

import { useAuth } from "@/context/AuthContext";
import LogoutButton from "@/components/LogoutButton";
import { useMemo, useState, useEffect, FormEvent, useRef, ChangeEvent } from "react";
import { API_BASE_URL } from "./../../lib/config.ts"

const uploadLogbookFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://paperplane.bolun.dev/api/v1/upload_log", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
};

type LogEntry = {
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

// NOTE: michael.smith@outlook.com is a valid email address for testing
const fetchLogs = async (idToken: string): Promise<Array<LogEntry>> => {
  const response = await fetch(`https://${API_BASE_URL}/api/v1/flight_entry`, {
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
    ? `https://${API_BASE_URL}/api/v1/flight_entry/${id}`
    : `https://${API_BASE_URL}/api/v1/flight_entry`;

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

const createFlightEntry = (entry: Omit<LogEntry, "id">, idToken: string) => saveFlightEntry("POST", entry, idToken);

const updateFlightEntry = (entry: LogEntry, idToken: string) =>
  saveFlightEntry("PATCH", entry, idToken, entry.id);

const deleteFlightEntry = async (id: string, idToken: string) => {
  const response = await fetch(`https://${API_BASE_URL}/api/v1/flight_entry/${id}`, {
    method: "DELETE",
    headers: genHeaders(idToken),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete flight entry");
  }

  return response.json();
};


export default function DashboardPage() {
  const { user, loading } = useAuth();

  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formState, setFormState] = useState({
    date: "",
    aircraftType: "",
    tailNumber: "",
    route: "",
    totalTime: "",
    picTime: "",
    instrumentTime: "",
    nightTime: "",
    dayLandings: "",
    nightLandings: "",
    remarks: "",
  });

  // Hidden input reference
const fileInputRef = useRef<HTMLInputElement>(null);
const [isUploading, setIsUploading] = useState(false);

// Handler for file input change
const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please upload an image file (JPEG, PNG, etc).");
    return;
  }

  try {
    setIsUploading(true);
    await uploadLogbookFile(file);
    alert("File uploaded successfully!");
    // Optionally refresh logs here
  } catch (err) {
    console.error(err);
    alert("Failed to upload file.");
  } finally {
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
};

  useEffect(() => {
    const load = async () => {
      const idToken = await user?.getIdToken()
      if (idToken) {
        fetchLogs(idToken).then(setLogs);
      }
    }
    load()
  }, [user]);

  const stats = useMemo(() => {
    const totalHours = logs.reduce((sum, log) => sum + log.totalFlightTime, 0);
    const totalPIC = logs.reduce((sum, log) => sum + log.picTime, 0);
    const totalIFR = logs.reduce((sum, log) => sum + log.instrumentTime, 0);
    const totalNight = logs.reduce((sum, log) => log.night ? sum + log.totalFlightTime : sum, 0);
    const totalLandings =
      logs.reduce((sum, log) => sum + log.dayLandings + log.nightLandings, 0);

    // Example "goals" for progress bars
    const goals = {
      yearlyHours: 100,
      instrumentHours: 40,
      nightHours: 20,
    };

    return {
      totalHours,
      totalPIC,
      totalIFR,
      totalNight,
      totalLandings,
      goals,
    };
  }, [logs]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="animate-pulse text-lg">Loading cockpit…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div data-testid = "sign-in-request">Please sign in to access your logbook.</div>
      </main>
    );
  }

  const handleAddEntry = (e: FormEvent) => {
    e.preventDefault();

    const newEntry = parseLogEntry(formState);

    // TODO: Post into DB.
    setLogs((prev) => [...prev, newEntry]);
    setFormState({
      date: "",
      aircraftType: "",
      tailNumber: "",
      route: "",
      totalTime: "",
      picTime: "",
      instrumentTime: "",
      nightTime: "",
      dayLandings: "",
      nightLandings: "",
      remarks: "",
    });
    setIsAddOpen(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Top bar */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 data-testid = "dashboard-header" className="text-3xl font-semibold tracking-tight"> 
              Pilot Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Flight time, proficiency, and logbook in one place.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-sky-400 flex items-center justify-center text-sm font-semibold">
                {user.email?.[0]?.toUpperCase() ?? "P"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user.email ?? "Pilot"}
                </span>
                <span className="text-xs text-slate-400">Signed in</span>
              </div>
            </div>
            <LogoutButton />
          </div>
        </header>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
          {/* Left column: Logbook & list */}
          <section className="space-y-4">
            {/* Actions */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Logbook</h2>
              <div className="flex gap-2">
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />

                {/* Styled button that opens the file picker */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="rounded-lg border border-slate-600/60 bg-slate-900 px-3 py-1.5 text-xs sm:text-sm hover:border-sky-500 hover:bg-slate-900/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Uploading…" : "Upload logbook file"}
                </button>

                <button
                  onClick={() => setIsAddOpen(true)}
                  className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-950 hover:bg-sky-400 transition"
                >
                  Add entry
                </button>
              </div>
            </div>
            {/* Log list */}
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur">
              <div className="grid grid-cols-6 gap-2 border-b border-slate-800 px-4 py-2 text-xs text-slate-400">
                <span>Date</span>
                <span>Aircraft</span>
                <span>Route</span>
                <span className="text-right">Total</span>
                <span className="text-right">PIC / IFR</span>
                <span className="text-right">Ldg</span>
              </div>
              <div className="max-h-[420px] overflow-y-auto text-sm">
                {logs.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-500 text-sm">
                    No flights logged yet. Add your first entry to get started.
                  </div>
                ) : (
                  logs
                    .slice()
                    .reverse()
                    .map((log) => (
                      <div
                        key={log.id}
                        className="grid grid-cols-6 gap-2 border-t border-slate-850/40 px-4 py-2 hover:bg-slate-800/60 transition"
                      >
                        <span className="truncate">{log.date}</span>
                        <span className="truncate">
                          {log.tailNumber}
                        </span>
                        <span className="truncate">{log.route}</span>
                        <span className="text-right">
                          {log.totalFlightTime.toFixed(1)} h
                        </span>
                        <span className="text-right">
                          {log.picTime.toFixed(1)} / {log.instrumentTime.toFixed(1)}
                        </span>
                        <span className="text-right">
                          {log.dayLandings + log.nightLandings}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </section>

          {/* Right column: stats */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Pilot status</h2>

            {/* Summary card */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 p-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Total time</p>
                  <p className="text-xl font-semibold">
                    {stats.totalHours.toFixed(1)} h
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">PIC time</p>
                  <p className="text-xl font-semibold">
                    {stats.totalPIC.toFixed(1)} h
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Instrument</p>
                  <p className="text-xl font-semibold">
                    {stats.totalIFR.toFixed(1)} h
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Night</p>
                  <p className="text-xl font-semibold">
                    {stats.totalNight.toFixed(1)} h
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Total landings</p>
                  <p className="text-xl font-semibold">{stats.totalLandings}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Flights logged</p>
                  <p className="text-xl font-semibold">{logs.length}</p>
                </div>
              </div>
            </div>

            {/* Progress bars */}
            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm">
              <StatusBar
                label="Yearly hours"
                current={stats.totalHours}
                goal={stats.goals.yearlyHours}
                unit="h"
                detail="Common target for active GA pilots."
              />
              <StatusBar
                label="Instrument training"
                current={stats.totalIFR}
                goal={stats.goals.instrumentHours}
                unit="h"
                detail="Toward a typical 40h IFR training benchmark."
              />
              <StatusBar
                label="Night experience"
                current={stats.totalNight}
                goal={stats.goals.nightHours}
                unit="h"
                detail="Helps maintain comfort and currency at night."
              />
            </div>

            {/* Currency notes (static text for now) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300 space-y-1.5">
              <p className="font-semibold text-slate-100 text-sm">
                Quick currency notes (informational only)
              </p>
              <p>
                • Day passenger currency: 3 takeoffs/landings in the last 90 days.
                • Night passenger currency: 3 full-stop landings at night in last 90 days.
                • IFR: 6 approaches, holding, and tracking in the last 6 months.
              </p>
              <p className="text-slate-500">
                This dashboard doesn&apos;t yet auto-compute legal currency, but
                your log entries here are set up to support that later.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Add entry slide-over */}
      {isAddOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-slate-950 border border-slate-800 shadow-xl p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add logbook entry</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formState.date}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, date: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Aircraft type
                  </label>
                  <input
                    type="text"
                    placeholder="C172R"
                    value={formState.aircraftType}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        aircraftType: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Tail number
                  </label>
                  <input
                    type="text"
                    placeholder="N12345"
                    value={formState.tailNumber}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        tailNumber: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Route
                </label>
                <input
                  type="text"
                  placeholder="KVNY → KSMO → KVNY"
                  value={formState.route}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, route: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <NumberField
                  label="Total time (h)"
                  value={formState.totalTime}
                  onChange={(v) =>
                    setFormState((s) => ({ ...s, totalTime: v }))
                  }
                />
                <NumberField
                  label="PIC (h)"
                  value={formState.picTime}
                  onChange={(v) => setFormState((s) => ({ ...s, picTime: v }))}
                />
                <NumberField
                  label="Instrument (h)"
                  value={formState.instrumentTime}
                  onChange={(v) =>
                    setFormState((s) => ({ ...s, instrumentTime: v }))
                  }
                />
                <NumberField
                  label="Night (h)"
                  value={formState.nightTime}
                  onChange={(v) =>
                    setFormState((s) => ({ ...s, nightTime: v }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                <NumberField
                  label="Day landings"
                  value={formState.dayLandings}
                  onChange={(v) =>
                    setFormState((s) => ({ ...s, dayLandings: v }))
                  }
                  step="1"
                />
                <NumberField
                  label="Night landings"
                  value={formState.nightLandings}
                  onChange={(v) =>
                    setFormState((s) => ({ ...s, nightLandings: v }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Approaches, maneuvers, instructor name, etc."
                  value={formState.remarks}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, remarks: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs sm:text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500 px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-950 hover:bg-sky-400"
                >
                  Save entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------- Small components ---------- */

function StatusBar({
  label,
  current,
  goal,
  unit,
  detail,
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
  detail?: string;
}) {
  const percent = Math.min(100, goal === 0 ? 0 : (current / goal) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-300">
          {current.toFixed(1)}
          {unit} / {goal}
          {unit}
        </p>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          style={{ width: `${percent}%` }}
          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 transition-[width]"
        />
      </div>
      {detail && (
        <p className="text-[11px] text-slate-500 leading-tight">{detail}</p>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step="0.1",
  min=0,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
        min={min}
      />
    </div>
  );
}
