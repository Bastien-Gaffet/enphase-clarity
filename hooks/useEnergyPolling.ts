import { useEffect } from "react";
import { useEnergyStore } from "../store/useEnergyStore";

/** Kicks off an initial fetch and refreshes on an interval while mounted. */
export function useEnergyPolling(intervalMs = 10000) {
  const refresh = useEnergyStore((s) => s.refresh);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);
}
