"use client";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-4xl mb-4">⚠</p>
      <h2 className="text-lg font-semibold text-primary mb-2">Something went wrong</h2>
      <p className="text-sm text-muted max-w-sm mb-6">{error.message || "An unexpected error occurred."}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-accent/15 border border-accent/30 px-4 py-2 text-sm text-accent hover:bg-accent/25 transition"
      >
        Try again
      </button>
    </div>
  );
}
