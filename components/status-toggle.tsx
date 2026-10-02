"use client";

import { Check, Minus } from "lucide-react";

export type StatusOption = { value: string; label: string; tone: "pos" | "neg" };

export function StatusToggle({
  value,
  options,
  onSelect,
  pending,
}: {
  value: string | null;
  options: readonly [StatusOption, StatusOption];
  onSelect: (value: string) => void;
  pending?: boolean;
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-[10px] border border-line bg-sunken p-[3px]">
      {options.map((opt) => {
        const selected = value === opt.value;
        const toneClass = selected
          ? opt.tone === "pos"
            ? "bg-accent-soft text-accent-text"
            : "bg-warn-soft text-warn-text"
          : "text-muted";
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            disabled={pending}
            onClick={() => onSelect(opt.value)}
            className={
              "inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-[7px] border-0 bg-transparent px-3 text-[13px] font-medium disabled:cursor-default disabled:opacity-60 " +
              toneClass
            }
          >
            {selected ? (
              opt.tone === "pos" ? (
                <Check size={14} strokeWidth={2.8} aria-hidden="true" />
              ) : (
                <Minus size={14} strokeWidth={2.8} aria-hidden="true" />
              )
            ) : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
