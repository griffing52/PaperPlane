import React from "react";
import { LogEntry } from "@/types/logbook";

type LogbookListProps = {
  entries: LogEntry[];
  isLoading: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
  verificationResults?: Record<string, boolean>;
};

export default function LogbookList({ 
  entries, 
  isLoading, 
  selectedIds = new Set(),
  onSelectionChange,
  onSelectAll,
  verificationResults
}: LogbookListProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="text-slate-400">Loading logbook...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="text-center">
          <p className="text-slate-400">No flights recorded yet</p>
          <p className="text-sm text-slate-500">
            Add your first entry to get started
          </p>
        </div>
      </div>
    );
  }

  const allSelected = entries.length > 0 && entries.every(e => selectedIds.has(e.id));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium w-8">
                {onSelectAll && (
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-slate-600 cursor-pointer"
                  />
                )}
              </th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Aircraft</th>
              <th className="px-4 py-3 font-medium">Route</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">PIC</th>
              <th className="px-4 py-3 font-medium text-right">Landings</th>
              <th className="px-4 py-3 font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className={`group hover:bg-slate-800/50 transition-colors ${
                  selectedIds.has(entry.id) ? "bg-slate-800/50" : ""
                }`}
              >
                <td className="px-4 py-3 w-8">
                  {onSelectionChange && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(entry.id)}
                      onChange={() => onSelectionChange(entry.id)}
                      className="rounded border-slate-600 cursor-pointer"
                    />
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
                  <div className="flex items-center gap-2">
                    {entry.tailNumber}
                    {verificationResults && entry.id && verificationResults[entry.id] === true && (
                      <span title="Verified flight">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                    {verificationResults && entry.id && verificationResults[entry.id] === false && (
                      <span title="Verification failed">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-500">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                  {entry.route}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-blue-400">
                  {entry.totalFlightTime.toFixed(1)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-300">
                  {entry.picTime > 0 ? entry.picTime.toFixed(1) : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-slate-300">
                  {entry.dayLandings + entry.nightLandings > 0
                    ? entry.dayLandings + entry.nightLandings
                    : "-"}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-slate-500 group-hover:text-slate-400">
                  {entry.remarks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
