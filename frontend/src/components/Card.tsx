import React from "react";

export function Card({
  title,
  children,
  right
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          <div>{right}</div>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

