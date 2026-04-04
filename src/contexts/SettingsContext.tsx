import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api } from "@/lib/api";

export type SettingsContextType = {
  /** `null` only during the initial fetch */
  ecommerceEnabled: boolean | null;
  inspectionFee: number;
  hourlyPlatformFee: number;
  settingsLoading: boolean;
  refreshSettings: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType>({
  ecommerceEnabled: null,
  inspectionFee: 50,
  hourlyPlatformFee: 20,
  settingsLoading: true,
  refreshSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [ecommerceEnabled, setEcommerceEnabled] = useState<boolean | null>(null);
  const [inspectionFee, setInspectionFee] = useState(50);
  const [hourlyPlatformFee, setHourlyPlatformFee] = useState(20);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const data = await api.get("/settings");
      setEcommerceEnabled(!!data.ecommerce_enabled);
      if (data.inspection_fee !== undefined) setInspectionFee(data.inspection_fee);
      if (data.hourly_platform_fee !== undefined) setHourlyPlatformFee(data.hourly_platform_fee);
    } catch {
      setEcommerceEnabled(false);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider
      value={{ ecommerceEnabled, inspectionFee, hourlyPlatformFee, settingsLoading, refreshSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
