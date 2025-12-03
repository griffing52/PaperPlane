import React, { useState } from "react";
import { LogEntry } from "@/types/logbook";
import NumberField from "./NumberField";

type AddEntryFormProps = {
  onClose: () => void;
  onSave: (entry: Omit<LogEntry, "id">) => Promise<void>;
  editingEntry?: LogEntry | null;
};

export default function AddEntryForm({ onClose, onSave, editingEntry }: AddEntryFormProps) {
  const [date, setDate] = useState(editingEntry ? editingEntry.date : new Date().toISOString().split("T")[0]);
  const [tailNumber, setTailNumber] = useState(editingEntry?.tailNumber || "");
  const [srcIcao, setSrcIcao] = useState(editingEntry?.srcIcao || "");
  const [destIcao, setDestIcao] = useState(editingEntry?.destIcao || "");
  const [route, setRoute] = useState(editingEntry?.route || "");
  const [totalFlightTime, setTotalFlightTime] = useState(editingEntry?.totalFlightTime.toString() || "");
  const [dayLandings, setDayLandings] = useState(editingEntry?.dayLandings.toString() || "0");
  const [nightLandings, setNightLandings] = useState(editingEntry?.nightLandings.toString() || "0");
  const [instrumentTime, setInstrumentTime] = useState(editingEntry?.instrumentTime.toString() || "0");
  const [picTime, setPicTime] = useState(editingEntry?.picTime.toString() || "0");
  const [dualReceived, setDualReceived] = useState(editingEntry?.dualReceivedTime.toString() || "0");
  const [isNight, setIsNight] = useState(editingEntry?.night || false);
  const [isSolo, setIsSolo] = useState(editingEntry?.solo || false);
  const [isXC, setIsXC] = useState(editingEntry?.crossCountry || false);
  const [remarks, setRemarks] = useState(editingEntry?.remarks || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const newEntry: Omit<LogEntry, "id"> = {
        date,
        tailNumber,
        srcIcao,
        destIcao,
        route,
        totalFlightTime: parseFloat(totalFlightTime) || 0,
        nightLandings: parseInt(nightLandings) || 0,
        dayLandings: parseInt(dayLandings) || 0, // Fix: assigned twice in original thought, correcting here
        instrumentTime: parseFloat(instrumentTime) || 0,
        picTime: parseFloat(picTime) || 0,
        dualReceivedTime: parseFloat(dualReceived) || 0,
        night: isNight,
        solo: isSolo,
        crossCountry: isXC,
        remarks,
      };
      // Correcting the object construction
      const entryToSave: Omit<LogEntry, "id"> = {
        date,
        tailNumber,
        srcIcao,
        destIcao,
        route,
        totalFlightTime: parseFloat(totalFlightTime) || 0,
        picTime: parseFloat(picTime) || 0,
        dualReceivedTime: parseFloat(dualReceived) || 0,
        instrumentTime: parseFloat(instrumentTime) || 0,
        dayLandings: parseInt(dayLandings) || 0,
        nightLandings: parseInt(nightLandings) || 0,
        night: isNight,
        solo: isSolo,
        crossCountry: isXC,
        remarks,
      };
      
      await onSave(entryToSave);
      onClose();
    } catch (error) {
      console.error("Failed to save entry", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {editingEntry ? "Edit Flight Entry" : "Add Flight Entry"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
              />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Tail Number
              </label>
              <input
                type="text"
                value={tailNumber}
                onChange={(e) => setTailNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs uppercase"
                placeholder="N12345"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs text-slate-400 mb-1">From (ICAO)</label>
              <input
                type="text"
                value={srcIcao}
                onChange={(e) => {
                  setSrcIcao(e.target.value)
                  return setRoute(`${srcIcao} ${e.target.value}`);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs uppercase"
                placeholder="KAPA"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">To (ICAO)</label>
              <input
                type="text"
                value={destIcao}
                onChange={(e) => {
                  setDestIcao(e.target.value)
                  return setRoute(`${srcIcao} ${e.target.value}`);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs uppercase"
                placeholder="KCOS"
              />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-4 gap-4 rounded-xl bg-slate-900/50 p-4">
            <NumberField
              label="Total Time"
              value={totalFlightTime}
              onChange={setTotalFlightTime}
            />
            <NumberField label="PIC" value={picTime} onChange={setPicTime} />
            <NumberField
              label="Dual Recv"
              value={dualReceived}
              onChange={setDualReceived}
            />
            <NumberField
              label="Instrument"
              value={instrumentTime}
              onChange={setInstrumentTime}
            />
          </div>

          {/* Landings & Flags */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-900/50 p-4">
            <NumberField
              label="Day Landings"
              value={dayLandings}
              onChange={setDayLandings}
              step="1"
            />
            <NumberField
              label="Night Landings"
              value={nightLandings}
              onChange={setNightLandings}
              step="1"
            />
            
            <div className="col-span-2 flex gap-6 mt-2">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isNight} 
                  onChange={e => setIsNight(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900"
                />
                Night Flight
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isXC} 
                  onChange={e => setIsXC(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900"
                />
                Cross Country
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isSolo} 
                  onChange={e => setIsSolo(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900"
                />
                Solo
              </label>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="h-20 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
              placeholder="Flight notes..."
            />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : editingEntry ? "Update Entry" : "Save Entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
