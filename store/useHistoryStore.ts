import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { EnphaseClient } from "../lib/enphase/client";
import { fetchHistoricalRollups, type DailyRollup } from "../lib/enphase/history";
import { useCredentialsStore } from "./useCredentialsStore";
import { useSettingsStore } from "./useSettingsStore";

interface HistoryState {
  /** Keyed by YYYY-MM-DD. */
  rollups: Record<string, DailyRollup>;
  /** Last calendar day successfully synced — the backfill cursor. */
  lastSyncedDate: string | null;
  /** commissionedOn value the cache was built against; a change invalidates it. */
  syncedCommissionedOn: string | null;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  /** Fetches the next batch of missing history (bounded — call again while hasMore is true). */
  sync: () => Promise<void>;
  reset: () => void;
}

function yesterday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d; // exclusive upper bound: up to (not including) today
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      rollups: {},
      lastSyncedDate: null,
      syncedCommissionedOn: null,
      hasMore: false,
      loading: false,
      error: null,

      sync: async () => {
        const { dataSource, enphaseSystemId, investment, tariff } = useSettingsStore.getState();
        if (dataSource !== "live") return;

        const { credentials, save } = useCredentialsStore.getState();
        if (!credentials || !enphaseSystemId) {
          set({ error: "Identifiants Enphase manquants." });
          return;
        }

        let { rollups, lastSyncedDate, syncedCommissionedOn } = get();
        if (syncedCommissionedOn !== investment.commissionedOn) {
          rollups = {};
          lastSyncedDate = null;
        }

        const fromDate = lastSyncedDate
          ? (() => {
              const d = new Date(lastSyncedDate);
              d.setDate(d.getDate() + 1);
              return d;
            })()
          : new Date(investment.commissionedOn);
        const toDate = yesterday();

        if (fromDate >= toDate) {
          set({ rollups, lastSyncedDate, syncedCommissionedOn: investment.commissionedOn, hasMore: false });
          return;
        }

        set({ loading: true, error: null });
        try {
          const client = new EnphaseClient(credentials, save);
          const result = await fetchHistoricalRollups(client, enphaseSystemId, fromDate, toDate, tariff);

          const merged = { ...rollups };
          for (const r of result.rollups) merged[r.date] = r;

          set({
            rollups: merged,
            lastSyncedDate: result.reachedDate ?? lastSyncedDate,
            syncedCommissionedOn: investment.commissionedOn,
            hasMore: result.hasMore,
            loading: false,
          });
        } catch (err) {
          set({ loading: false, error: err instanceof Error ? err.message : "Synchronisation impossible." });
        }
      },

      reset: () => set({ rollups: {}, lastSyncedDate: null, syncedCommissionedOn: null, hasMore: false }),
    }),
    {
      name: "enphase-clarity-history",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
