import React from 'react';

interface LeftFloatingPanelProps {
  children: React.ReactNode;
}

export function LeftFloatingPanel({ children }: LeftFloatingPanelProps): React.ReactElement {
  return (
    <aside className="absolute left-4 top-20 z-40 w-80 max-h-[calc(100vh-6rem)] shrink-0 rounded-2xl border border-[var(--color-brand-border)]/80 bg-[var(--brand-surface)]/90 backdrop-blur-xl shadow-lg animate-in slide-in-from-left duration-200 pointer-events-auto flex flex-col">
      <div className="flex-1 min-h-0 flex-col overflow-y-auto custom-scrollbar">{children}</div>
    </aside>
  );
}
