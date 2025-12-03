import React from "react";

type NumberFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  min?: number;
};

export default function NumberField({
  label,
  value,
  onChange,
  step = "0.1",
  min = 0,
}: NumberFieldProps) {
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
