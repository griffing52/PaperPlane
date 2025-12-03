import React from "react";
import { LogEntry } from "@/types/logbook";

type LogbookListProps = {
  entries: LogEntry[];
  isLoading: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
  onEdit?: (entry: LogEntry) => void;
};

export default function LogbookList({ 
  entries, 
  isLoading, 
  selectedIds = new Set(),
  onSelectionChange,
  onSelectAll,
  onEdit
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

  const allSelected = entries.length > 0 && entries.every(e => selectedIds.has(String(e.id)));

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
              <th className="px-4 py-3 font-medium w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {entries.map((entry) => (
              <tr
                key={String(entry.id)}
                className={`group hover:bg-slate-800/50 transition-colors ${
                  selectedIds.has(String(entry.id)) ? "bg-slate-800/50" : ""
                }`}
              >
                <td className="px-4 py-3 w-8">
                  {onSelectionChange && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(String(entry.id))}
                      onChange={() => onSelectionChange(String(entry.id))}
                      className="rounded border-slate-600 cursor-pointer"
                    />
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
                  {entry.tailNumber}
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
                <td className="px-4 py-3 w-8">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(entry)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-200"
                      title="Edit entry"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
