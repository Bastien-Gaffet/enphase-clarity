import { create } from "zustand";
import type { EnergyInterval } from "../lib/calculations/types";
import { EnphaseClient, toEnergyIntervals } from "../lib/enphase/client";
import { generateMockDay, generateMockSnapshot, type LiveSnapshot } from "../lib/enphase/mock";
import { useCredentialsStore } from "./useCredentialsStore";
import { useSettingsStore } from "./useSettingsStore";

interface EnergyState {
  snapshot: LiveSnapshot | null;
  todayIntervals: EnergyInterval[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useEnergyStore = create<EnergyState>((set, get) => ({
  snapshot: null,
  todayIntervals: [],
  loading: false,
  error: null,

  refresh: async () => {
    const { dataSource, mockSite, enphaseSystemId } = useSettingsStore.getState();
    set({ loading: true, error: null });

    try {
      if (dataSource === "mock") {
        const snapshot = generateMockSnapshot(mockSite);
        const todayIntervals = generateMockDay(new Date(), mockSite);
        set({ snapshot, todayIntervals, loading: false });
        return;
      }

      const { credentials } = useCredentialsStore.getState();
      if (!credentials || !enphaseSystemId) {
        set({ loading: false, error: "Identifiants Enphase manquants — configure-les dans Réglages." });
        return;
      }

      const client = new EnphaseClient(credentials, async (updated) => {
        await useCredentialsStore.getState().save(updated);
      });

      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const rgm = await client.getRgmStats(
        enphaseSystemId,
        Math.floor(dayStart.getTime() / 1000),
        Math.floor(Date.now() / 1000)
      );
      const todayIntervals = toEnergyIntervals(rgm);
      const summary = await client.getSummary(enphaseSystemId);

      const last = todayIntervals[todayIntervals.length - 1];
      const snapshot: LiveSnapshot = {
        productionKw: summary.current_power / 1000,
        consumptionKw: last ? last.consumptionKwh / (last.durationHours || 0.25) : 0,
        gridKw: last
          ? (last.gridImportKwh - last.gridExportKwh) / (last.durationHours || 0.25)
          : 0,
        isAutonomous: last ? last.gridImportKwh <= last.gridExportKwh : false,
        timestamp: new Date().toISOString(),
      };

      set({ snapshot, todayIntervals, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : "Erreur inconnue" });
    }
  },
}));
