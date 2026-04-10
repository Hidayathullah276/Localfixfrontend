import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";
import { motion } from "framer-motion";
import {
  ArrowLeft, Store, SlidersHorizontal, Save, RefreshCw,
  ToggleLeft, ToggleRight, IndianRupee, Zap, Settings,
  ShoppingBag, Package, CheckCircle, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function AdminSettings() {
  const navigate = useNavigate();
  const {
    ecommerceEnabled,
    inspectionFee: currentInspectionFee,
    hourlyPlatformFee: currentHourlyFee,
    settingsLoading,
    refreshSettings,
  } = useSettings();

  const [shopToggle, setShopToggle] = useState<boolean>(false);
  const [inspectionFee, setInspectionFee] = useState(50);
  const [hourlyFee, setHourlyFee] = useState(20);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (ecommerceEnabled !== null) setShopToggle(!!ecommerceEnabled);
    setInspectionFee(currentInspectionFee);
    setHourlyFee(currentHourlyFee);
  }, [ecommerceEnabled, currentInspectionFee, currentHourlyFee]);

  const handleShopToggle = async (val: boolean) => {
    setShopToggle(val);
    setToggling(true);
    try {
      // Send correct fields expected by standard backend route `/api/settings`
      await api.put("/settings", { shopEnabled: val });
      await refreshSettings();
      toast.success(val ? "🛍️ Shop is now LIVE!" : "🔴 Shop hidden from users", {
        description: val
          ? "Customers can now browse and buy products."
          : "All shop routes are now disabled for customers.",
      });
    } catch {
      setShopToggle(!val);
      toast.error("Failed to toggle shop visibility");
    } finally {
      setToggling(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Send a single PUT request with correctly mapped properties
      await api.put("/settings", { 
        shopEnabled: shopToggle,
        inspectionFee: Number(inspectionFee), 
        platformFee: Number(hourlyFee) 
      });
      
      await refreshSettings();
      toast.success("✅ Settings saved!", {
        description: "Fees and visibility have been updated.",
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <div className="gradient-hero p-6 pb-14 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate("/admin")}
            className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => { refreshSettings(); toast.info("Settings refreshed"); }}
            className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-primary-foreground">Platform Settings</h1>
            <p className="text-primary-foreground/70 text-sm">Control fees, shop & more</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4 pb-8">
        {/* ─── Shop Toggle Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5"
          style={{ borderRadius: "20px" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-foreground">Shop Section</h2>
              <p className="text-[11px] text-muted-foreground">E-commerce visibility control</p>
            </div>
          </div>

          {/* Toggle Row */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30 mb-4">
            <div>
              <p className="font-semibold text-sm text-foreground">Enable Shop Section</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {shopToggle ? "Customers can browse & buy products" : "Shop is completely hidden"}
              </p>
            </div>
            <Switch
              checked={shopToggle}
              onCheckedChange={handleShopToggle}
              disabled={toggling || settingsLoading}
            />
          </div>

          {/* Status indicator */}
          <div className={`flex items-start gap-3 p-3.5 rounded-xl transition-all duration-300 ${
            shopToggle
              ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
              : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
          }`}>
            {shopToggle
              ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            }
            <div className="text-[11px] font-medium leading-relaxed">
              {shopToggle ? (
                <div className="text-emerald-700 dark:text-emerald-400">
                  <p className="font-bold mb-0.5">Shop is LIVE ✅</p>
                  <p>• Shop link appears in bottom navigation</p>
                  <p>• Customers can browse products, add to cart, and checkout</p>
                  <p>• Product pages and cart are accessible</p>
                </div>
              ) : (
                <div className="text-red-600 dark:text-red-400">
                  <p className="font-bold mb-0.5">Shop is HIDDEN ❌</p>
                  <p>• Shop link removed from navigation bar</p>
                  <p>• All /shop routes redirect to home page</p>
                  <p>• Cart and checkout are not accessible</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => navigate("/admin/products")}
              className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200/50 hover:bg-violet-100 transition-colors"
            >
              <Package className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-violet-700 dark:text-violet-400">Manage Products</span>
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200/50 hover:bg-indigo-100 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">View Orders</span>
            </button>
          </div>
        </motion.div>

        {/* ─── Platform Fees Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-5"
          style={{ borderRadius: "20px" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <SlidersHorizontal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-foreground">Platform Fees</h2>
              <p className="text-[11px] text-muted-foreground">Applied on every booking dynamically</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Inspection Fee */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                Inspection / Booking Fee (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
                <Input
                  type="number"
                  min={0}
                  value={inspectionFee}
                  onChange={(e) => setInspectionFee(Number(e.target.value))}
                  className="pl-7 h-12 rounded-xl text-sm font-semibold"
                />
              </div>
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200/50">
                <IndianRupee className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-400">
                  Charged upfront per booking for site inspection. Currently set to ₹{currentInspectionFee}.
                </p>
              </div>
            </div>

            {/* Hourly Platform Fee */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                Platform Commission Fee (₹ per hour)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
                <Input
                  type="number"
                  min={0}
                  value={hourlyFee}
                  onChange={(e) => setHourlyFee(Number(e.target.value))}
                  className="pl-7 h-12 rounded-xl text-sm font-semibold"
                />
              </div>
              <div className="flex items-start gap-2 p-2.5 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-200/50">
                <Zap className="w-3 h-3 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-indigo-700 dark:text-indigo-400">
                  Added to booking total for hourly jobs. Currently ₹{currentHourlyFee}/hr. Fee is fetched live at booking time.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Current Config Summary ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
          style={{ borderRadius: "20px" }}
        >
          <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-primary" />
            Current Live Configuration
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "Shop Status",
                value: ecommerceEnabled ? "Enabled ✅" : "Disabled ❌",
                color: ecommerceEnabled ? "text-emerald-600" : "text-red-500",
                bg: ecommerceEnabled ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20",
              },
              {
                label: "Inspection Fee",
                value: `₹${currentInspectionFee}`,
                color: "text-amber-600",
                bg: "bg-amber-50 dark:bg-amber-900/20",
              },
              {
                label: "Hourly Fee",
                value: `₹${currentHourlyFee}/hr`,
                color: "text-indigo-600",
                bg: "bg-indigo-50 dark:bg-indigo-900/20",
              },
              {
                label: "Fee Impact",
                value: `+₹${currentInspectionFee + currentHourlyFee} max`,
                color: "text-violet-600",
                bg: "bg-violet-50 dark:bg-violet-900/20",
              },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-3 ${item.bg}`}>
                <p className="text-[9px] text-muted-foreground mb-0.5 font-medium">{item.label}</p>
                <p className={`text-xs font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Save Button ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 text-white shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 hover:scale-[1.01]"
          >
            {saving ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving settings…</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save All Settings</>
            )}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Changes reflect immediately for all users on the platform
          </p>
        </motion.div>
      </div>
    </div>
  );
}
