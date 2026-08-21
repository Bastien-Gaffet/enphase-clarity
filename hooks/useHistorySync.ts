import { useEffect } from "react";
import { useHistoryStore } from "../store/useHistoryStore";

/**
 * Kicks off history backfill on mount and keeps calling sync() while more
 * chunks remain (fetchHistoricalRollups bounds each call, so a long backfill
 * catches up gradually instead of firing dozens of requests at once).
 */
export function useHistorySync() {
  const sync = useHistoryStore((s) => s.sync);
  const hasMore = useHistoryStore((s) => s.hasMore);
  const loading = useHistoryStore((s) => s.loading);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const id = setTimeout(sync, 3000);
    return () => clearTimeout(id);
  }, [hasMore, loading, sync]);
}
