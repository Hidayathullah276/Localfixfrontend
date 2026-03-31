import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Smartphone, Bell, Power, ChevronRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function PrivacySecurity() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const handleUpdatePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    toast.info("Password update feature coming soon with backend integration.");
    setIsChangingPassword(false);
    setPasswords({ current: "", new: "", confirm: "" });
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
          <h1 className="text-xl font-display font-bold text-white">Privacy & Security</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">Account Security</p>
            <p className="text-white/70 text-[10px]">Manage your security preferences</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        {/* Change Password Section */}
        <div className="glass-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Lock className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold">Change Password</span>
            </div>
            <button 
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="text-xs text-primary font-bold px-3 py-1 bg-primary/10 rounded-full"
            >
              {isChangingPassword ? "Cancel" : "Update"}
            </button>
          </div>

          {isChangingPassword && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="space-y-3 pt-2"
            >
              <Input 
                type="password" 
                placeholder="Current Password" 
                className="rounded-xl"
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
              />
              <Input 
                type="password" 
                placeholder="New Password" 
                className="rounded-xl"
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
              />
              <Input 
                type="password" 
                placeholder="Confirm New Password" 
                className="rounded-xl"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
              />
              <Button onClick={handleUpdatePassword} className="w-full btn-primary-gradient rounded-xl h-11">
                Save Password
              </Button>
            </motion.div>
          )}
        </div>

        {/* Account Settings */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account Controls</h3>
          </div>
          
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3 text-left">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Update Phone Number</p>
                <p className="text-[10px] text-muted-foreground">{user?.phone || "No phone set"}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Push Notifications</span>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Two-Factor Auth</span>
            </div>
            <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
          </div>
        </div>

        {/* Sensitive Actions */}
        <div className="glass-card p-4 space-y-3">
          <button 
            onClick={() => {
              toast.success("Successfully logged out from all other devices");
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Power className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium">Logout from all devices</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Power className="w-4 h-4" />
            <span className="text-sm font-medium">Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
