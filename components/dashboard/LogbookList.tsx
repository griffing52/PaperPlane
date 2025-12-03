import React from "react";
import { LogEntry } from "@/types/logbook";

type LogbookListProps = {
  entries: LogEntry[];
  isLoading: boolean;
};

export default function LogbookList({ entries, isLoading }: LogbookListProps) {
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

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
            <tr>
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
                className="group hover:bg-slate-800/50 transition-colors"
              >
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
