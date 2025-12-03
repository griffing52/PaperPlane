import React, { useMemo } from "react";
import { LogEntry } from "@/types/logbook";

type StatusBarProps = {
  entries: LogEntry[];
};

function ProgressBar({
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

export default function StatusBar({ entries }: StatusBarProps) {
  const stats = useMemo(() => {
    const totalHours = entries.reduce((sum, log) => sum + log.totalFlightTime, 0);
    const totalPIC = entries.reduce((sum, log) => sum + log.picTime, 0);
    const totalIFR = entries.reduce((sum, log) => sum + log.instrumentTime, 0);
    // Approximation for night hours based on boolean flag, as per previous logic
    const totalNight = entries.reduce((sum, log) => log.night ? sum + log.totalFlightTime : sum, 0);
    const totalLandings =
      entries.reduce((sum, log) => sum + log.dayLandings + log.nightLandings, 0);

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
  }, [entries]);

  return (
    <div className="space-y-6">
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
              <p className="text-xl font-semibold">{entries.length}</p>
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm">
          <ProgressBar
            label="Yearly hours"
            current={stats.totalHours}
            goal={stats.goals.yearlyHours}
            unit="h"
            detail="Common target for active GA pilots."
          />
          <ProgressBar
            label="Instrument training"
            current={stats.totalIFR}
            goal={stats.goals.instrumentHours}
            unit="h"
            detail="Toward a typical 40h IFR training benchmark."
          />
          <ProgressBar
            label="Night experience"
            current={stats.totalNight}
            goal={stats.goals.nightHours}
            unit="h"
            detail="Helps maintain comfort and currency at night."
          />
        </div>
    </div>
  );
}
