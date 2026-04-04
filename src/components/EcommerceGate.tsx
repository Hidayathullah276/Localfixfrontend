import { Navigate } from "react-router-dom";
import { useSettings } from "@/contexts/SettingsContext";
import { BottomNav } from "@/components/BottomNav";

/**
 * When e-commerce is disabled, redirects home and avoids rendering shop subtree.
 */
export function EcommerceGate({ children }: { children: React.ReactNode }) {
  const { ecommerceEnabled, settingsLoading } = useSettings();

  if (settingsLoading || ecommerceEnabled === null) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="w-10 h-10 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl h-36 bg-muted/60 animate-pulse"
                style={{ borderRadius: "16px" }}
              />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!ecommerceEnabled) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
