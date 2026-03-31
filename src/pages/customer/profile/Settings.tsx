import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Settings as SettingsIcon, Globe, Moon, Sun, BellRing, Info, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("english");
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    // Initial theme check
    const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(currentTheme);
  }, []);

  const handleThemeChange = (val: string) => {
    setTheme(val);
    if (val === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    toast.success(`Theme switched to ${val} mode`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="gradient-hero p-6 pb-12 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate("/profile")}
            className="p-2 rounded-full bg-white/20 backdrop-blur text-white active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold text-white">App Settings</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 text-white">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white font-medium">Preferences</p>
            <p className="text-white/70 text-[10px]">Customize your app experience</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        {/* Appearance Section */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Appearance & Language</h3>
          </div>
          
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Language</span>
            </div>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-28 h-8 rounded-lg text-xs bg-muted/50 border-none">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="telugu">Telugu (తెలుగు)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <span className="text-sm font-medium">Dark Mode</span>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={(checked) => handleThemeChange(checked ? "dark" : "light")} />
          </div>
        </div>

        {/* Notifications Section */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Communications</h3>
          </div>
          
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <BellRing className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-[10px] text-muted-foreground">Booking & account updates</p>
              </div>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          
          <div className="p-4 border-t border-border flex items-center justify-between group active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Notification Preferences</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Info Section */}
        <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted text-muted-foreground mb-4">
                <SettingsIcon className="w-6 h-6 animate-spin-slow opacity-20" />
            </div>
            <h4 className="text-sm font-bold text-foreground">LocalFix Platform</h4>
            <p className="text-[10px] text-muted-foreground mt-1">Version 1.2.0-stable</p>
            <p className="text-[9px] text-muted-foreground/50 mt-6 tracking-tight">
                Designed and developed with ❤️ for India's fixers.
            </p>
        </div>
      </div>
    </div>
  );
}
