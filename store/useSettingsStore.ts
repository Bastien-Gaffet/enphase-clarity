import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SolarInvestment, TariffConfig } from "../lib/calculations/types";
import type { MockSiteConfig } from "../lib/enphase/mock";
import { defaultMockSite } from "../lib/enphase/mock";

export type DataSource = "mock" | "live";

/** "system" follows the OS setting; the others pin the scheme. */
export type ThemePreference = "system" | "light" | "dark";

export interface EvChargerConfig {
  chargerPowerKw: number;
  batteryCapacityKwh: number;
  defaultWindowStartHour: number;
  defaultWindowEndHour: number;
}

interface SettingsState {
  dataSource: DataSource;
  themePreference: ThemePreference;
  tariff: TariffConfig;
  investment: SolarInvestment;
  mockSite: MockSiteConfig;
  evCharger: EvChargerConfig;
  enphaseSystemId: string;
  setDataSource: (source: DataSource) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setTariff: (tariff: Partial<TariffConfig>) => void;
  setInvestment: (investment: Partial<SolarInvestment>) => void;
  setMockSite: (site: Partial<MockSiteConfig>) => void;
  setEvCharger: (config: Partial<EvChargerConfig>) => void;
  setEnphaseSystemId: (id: string) => void;
}

const defaultTariff: TariffConfig = {
  hpPricePerKwh: 0.27,
  hcPricePerKwh: 0.2068,
  hcWindows: [{ start: "22:00", end: "06:00" }],
  subscriptionMonthlyEUR: 15.5,
  surplusSellPricePerKwh: 0.04,
};

const defaultInvestment: SolarInvestment = {
  totalPriceEUR: 12000,
  monthlyPaymentEUR: 0,
  loanTermMonths: 0,
  commissionedOn: new Date(new Date().getFullYear() - 1, 0, 1).toISOString(),
};

const defaultEvCharger: EvChargerConfig = {
  chargerPowerKw: 7.4,
  batteryCapacityKwh: 22,
  defaultWindowStartHour: 20,
  defaultWindowEndHour: 7,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dataSource: "mock",
      themePreference: "system",
      tariff: defaultTariff,
      investment: defaultInvestment,
      mockSite: defaultMockSite,
      evCharger: defaultEvCharger,
      enphaseSystemId: "",
      setDataSource: (dataSource) => set({ dataSource }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setTariff: (patch) => set((s) => ({ tariff: { ...s.tariff, ...patch } })),
      setInvestment: (patch) => set((s) => ({ investment: { ...s.investment, ...patch } })),
      setMockSite: (patch) => set((s) => ({ mockSite: { ...s.mockSite, ...patch } })),
      setEvCharger: (patch) => set((s) => ({ evCharger: { ...s.evCharger, ...patch } })),
      setEnphaseSystemId: (enphaseSystemId) => set({ enphaseSystemId }),
    }),
    {
      name: "enphase-clarity-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
