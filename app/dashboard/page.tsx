"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import LogoutButton from "@/components/LogoutButton";
import { LogEntry } from "@/types/logbook";
import {
  fetchLogs,
  createFlightEntry,
  uploadLogbookFile,
} from "@/lib/api/logbook";
import StatusBar from "@/components/dashboard/StatusBar";
import LogbookList from "@/components/dashboard/LogbookList";
import AddEntryForm from "@/components/dashboard/AddEntryForm";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Auth check
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch logs
  useEffect(() => {
    if (user) {
      loadLogs();
    }
  }, [user]);

  const loadLogs = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const data = await fetchLogs(token);
      setEntries(data);
    } catch (error) {
      console.error("Failed to load logs", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadLogbookFile(file);
      
      if (user && response.records && Array.isArray(response.records)) {
          const token = await user.getIdToken();
          
          // Save each record
          let savedCount = 0;
          for (const record of response.records) {
              // Map OCR record to LogEntry format
              const entry = {
                  date: record.date,
                  tailNumber: record.tail_number,
                  srcIcao: record.source_airport,
                  destIcao: record.destination_airport,
                  route: record.source_airport && record.destination_airport 
                    ? `${record.source_airport} -> ${record.destination_airport}`
                    : null,
                  totalFlightTime: record.total_time || 0,
                  picTime: record.pic_hours || 0,
                  dualReceivedTime: 0,
                  instrumentTime: record.instrument_hours || 0,
                  crossCountry: false,
                  night: (record.night_hours || 0) > 0,
                  solo: false,
                  dayLandings: record.landings_day || 0,
                  nightLandings: record.landings_night || 0,
                  remarks: record.remarks || null
              };
              
              await createFlightEntry(entry, token);
              savedCount++;
          }

          // Refresh logs
          const data = await fetchLogs(token);
          setEntries(data);
          alert(`Successfully imported ${savedCount} entries!`);
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to process logbook image. Ensure the backend server is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveEntry = async (entryData: Omit<LogEntry, "id">) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const newEntry = await createFlightEntry(entryData, token);
      // The API returns the created entry?
      // If so, add it to state.
      // But createFlightEntry returns response.json().
      // Assuming it returns the created entry.
      // We need to cast it or ensure it matches LogEntry.
      // Ideally we should re-fetch or append.
      // Let's append for now, assuming the response is the entry.
      // But wait, the response might be different.
      // Safest is to reload logs.
      await loadLogs();
    } catch (error) {
      console.error("Failed to save entry", error);
      throw error; 
    }
  };

  if (loading || !user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <BrandLogo />
            <div className="hidden md:flex items-center gap-1">
              <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white">
                Logbook
              </button>
              <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:text-white">
                Reports
              </button>
              <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:text-white">
                Aircraft
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-white">
                {user.displayName || "Pilot"}
              </div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Pilot Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Flight time, proficiency, and logbook in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr,1fr]">
          {/* Logbook Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Logbook</h2>
              <div className="flex gap-3">
                <label className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                  {isUploading ? "Processing..." : "Upload logbook file"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
                <button
                  onClick={() => setShowAddEntry(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
                >
                  Add entry
                </button>
              </div>
            </div>
            
            <LogbookList entries={entries} isLoading={isLoading} />
          </section>

          {/* Pilot Status Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Pilot status</h2>
            
            <StatusBar entries={entries} />

            {/* Currency notes */}
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
      </main>

      {/* Add Entry Modal */}
      {showAddEntry && (
        <AddEntryForm
          onClose={() => setShowAddEntry(false)}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}
