"use client";

export function ToggleField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-panel-2 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold">{label}</p>
        {hint && <p className="text-text-dim text-[11.5px] mt-0.5">{hint}</p>}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-[10px] border px-3 py-1.5 text-xs font-semibold transition-colors ${
            value
              ? "border-accent-border bg-accent-soft text-accent-label"
              : "border-border bg-panel text-text-dim"
          }`}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-[10px] border px-3 py-1.5 text-xs font-semibold transition-colors ${
            !value
              ? "border-accent-border bg-accent-soft text-accent-label"
              : "border-border bg-panel text-text-dim"
          }`}
        >
          Não
        </button>
      </div>
    </div>
  );
}
