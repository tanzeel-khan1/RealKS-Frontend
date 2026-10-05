import React from 'react';

export default function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full animate-pulse">
      {/* Header */}
      <div className="flex gap-4 px-5 py-3 border-b border-border bg-muted/50">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-muted-foreground/20 rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-5 py-4 border-b border-border last:border-0 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-3 bg-muted-foreground/10 rounded flex-1"
              style={{ opacity: 1 - c * 0.12 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}