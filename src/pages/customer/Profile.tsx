import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { motion } from "framer-motion";
import { User, Phone, LogOut, ChevronRight, Shield, Star, Settings, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, signOut, roles } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const menuItems = [
    { icon: Star, label: "My Reviews", action: () => navigate("/profile/reviews") },
    { icon: Shield, label: "Privacy & Security", action: () => navigate("/profile/privacy") },
    { icon: HelpCircle, label: "Help & Support", action: () => navigate("/profile/help") },
    { icon: Settings, label: "Settings", action: () => navigate("/profile/settings") },
  ];

  if (!roles.includes("worker") && !roles.includes("admin")) {
    menuItems.unshift({
      icon: Star, // Using Star icon for prominence, maybe changed later
      label: "Become a Worker",
      action: () => navigate("/worker/register")
    });
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="gradient-hero p-6 pb-12 rounded-b-[2rem]">
        <h1 className="text-xl font-display font-bold text-primary-foreground mb-6">Profile</h1>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-primary-foreground">
              {user?.full_name || "User"}
            </h2>
            <p className="text-primary-foreground/70 text-sm flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {user?.phone || user?.email || "Not set"}
            </p>
            <span className="text-[10px] bg-primary-foreground/10 text-primary-foreground px-2 py-0.5 rounded-full mt-1 inline-block">
              {roles.includes("admin") ? "Admin" : roles.includes("worker") ? "Worker" : "Customer"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-3">
        {/* Role shortcuts */}
        {roles.includes("worker") && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate("/worker")}
            className="w-full glass-card-hover p-4 flex items-center justify-between"
          >
            <span className="font-medium text-foreground">Switch to Worker Dashboard</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}
        {roles.includes("admin") && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate("/admin")}
            className="w-full glass-card-hover p-4 flex items-center justify-between"
          >
            <span className="font-medium text-foreground">Open Admin Dashboard</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}

        {/* Menu */}
        <div className="glass-card overflow-hidden">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={item.action}
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground flex-1 text-left">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>

        <button
          onClick={handleSignOut}
          className="w-full glass-card p-4 flex items-center gap-3 text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
