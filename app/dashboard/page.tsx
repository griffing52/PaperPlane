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
  deleteFlightEntry,
  verifyFlightEntry,
  updateFlightEntry,
} from "@/lib/api/logbook";
import StatusBar from "@/components/dashboard/StatusBar";
import LogbookList from "@/components/dashboard/LogbookList";
import AddEntryForm from "@/components/dashboard/AddEntryForm";
import UploadPreviewModal from "@/components/dashboard/UploadPreviewModal"; 

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);
  
  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false); 

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [verificationResults, setVerificationResults] = useState<Record<string, boolean>>({});
  const [isVerifying, setIsVerifying] = useState(false);

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

    // Generate Base64 preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
        setUploadPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setShowUploadModal(true); 
    
    try {
      const response = await uploadLogbookFile(file);
      
      if (user && response.records && Array.isArray(response.records)) {
          const token = await user.getIdToken();
          
          // Save each record
          let savedCount = 0;
          for (const record of response.records) {
              const entry = {
                  date: record.date,
                  tailNumber: record.tailNumber,
                  srcIcao: record.srcIcao,
                  destIcao: record.destIcao,
                  route: record.srcIcao && record.destIcao 
                    ? `${record.srcIcao} \u2192 ${record.destIcao}`
                    : null,
                  totalFlightTime: record.totalFlightTime || 0,
                  picTime: record.picTime || 0,
                  dualReceivedTime: record.dualReceivedTime || 0,
                  instrumentTime: record.instrumentTime || 0,
                  crossCountry: record.crossCountry || false,
                  night: record.night || false,
                  solo: record.solo || false,
                  dayLandings: record.dayLandings || 0,
                  nightLandings: record.nightLandings || 0,
                  remarks: record.remarks || null
              };
              
              await createFlightEntry(entry, token);
              savedCount++;
          }

          // Refresh logs
          const data = await fetchLogs(token);
          setEntries(data);
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to process logbook image. Ensure the backend server is running.");
    } finally {
      setIsUploading(false);
      // Reset the file input so the same file can be uploaded again
      e.target.value = "";
    }
  };

  const handleSaveEntry = async (entryData: Omit<LogEntry, "id">) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await createFlightEntry(entryData, token);
      await loadLogs();
    } catch (error) {
      console.error("Failed to save entry", error);
      throw error; 
    }
  };

  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(entries.map(e => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleVerify = async () => {
    if (!user) return;
    setIsVerifying(true);
    const results: Record<string, boolean> = {};
    
    try {
      const token = await user.getIdToken();
      const entriesToVerify = selectedIds.size > 0 
        ? entries.filter(e => e.id && selectedIds.has(e.id))
        : entries;

      let verifiedCount = 0;
      for (const entry of entriesToVerify) {
        if (!entry.id) continue;
        try {
          const result = await verifyFlightEntry(entry, token);
          const isVerified = !!result;
          results[entry.id] = isVerified;
          if (isVerified) verifiedCount++;
        } catch (error) {
          console.error(`Failed to verify entry ${entry.id}`, error);
          results[entry.id] = false;
        }
      }
      setVerificationResults(prev => ({ ...prev, ...results }));
      alert(`Verification complete. Verified ${verifiedCount} out of ${entriesToVerify.length} checked flights.`);
    } catch (error) {
      console.error("Verification failed", error);
      alert("Verification process failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = window.confirm(
      `Delete ${selectedIds.size} flight ${selectedIds.size === 1 ? "entry" : "entries"}?`
    );
    
    if (!confirmed) return;

    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      for (const id of selectedIds) {
        try {
          await deleteFlightEntry(id, token);
        } catch (error) {
          console.error(`Failed to delete entry ${id}`, error);
        }
      }
      await loadLogs();
      setSelectedIds(new Set());
      alert(`Successfully deleted ${selectedIds.size} entries!`);
    } catch (error) {
      console.error("Failed to delete entries", error);
      alert("Failed to delete some entries.");
    }
  };

  const handleEditEntry = (entry: LogEntry) => {
    setEditingEntry(entry);
  };

  const handleSaveEditedEntry = async (entryData: Omit<LogEntry, "id">) => {
    if (!user || !editingEntry) return;
    try {
      const token = await user.getIdToken();
      await updateFlightEntry(
        { ...entryData, id: editingEntry.id } as LogEntry,
        token
      );
      await loadLogs();
      setEditingEntry(null);
    } catch (error) {
      console.error("Failed to update entry", error);
      throw error;
    }
  };

  if (loading || !user) {
    return null;
  }

  // FIXED: Single return statement merging the UI and the Modals
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <BrandLogo />
            <div className="hidden md:flex items-center gap-1">
              <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white">
                Logbook
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
        <div className="mb-8">
          <h1 data-testid="dashboard-header" className="text-3xl font-semibold tracking-tight text-white">
            Pilot Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Flight time, proficiency, and logbook in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr,1fr]">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Logbook</h2>
              <div className="flex gap-3">
                <button data-testid="verify-button"
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                >
                  {isVerifying ? "Verifying..." : "Verify"}
                </button>

                {selectedIds.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20"
                  >
                    Delete ({selectedIds.size})
                  </button>
                )}

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
            
            <LogbookList 
              entries={entries} 
              isLoading={isLoading}
              selectedIds={selectedIds}
              onSelectionChange={handleToggleSelection}
              onSelectAll={handleSelectAll}
              verificationResults={verificationResults}
              onEdit={handleEditEntry}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Pilot status</h2>
            <StatusBar entries={entries} />
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

      {}
      <UploadPreviewModal
        isOpen={showUploadModal}
        isUploading={isUploading}
        imageSrc={uploadPreview}
        onClose={() => setShowUploadModal(false)}
      />

      {}
      {(showAddEntry || editingEntry) && (
        <AddEntryForm
          onClose={() => {
            setShowAddEntry(false);
            setEditingEntry(null);
          }}
          onSave={editingEntry ? handleSaveEditedEntry : handleSaveEntry}
          editingEntry={editingEntry}
        />
      )}
    </div>
  );
}