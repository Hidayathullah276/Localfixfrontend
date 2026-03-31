import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, ShieldAlert, Siren, UserRound } from "lucide-react";

export default function WorkerEmergency() {
  const navigate = useNavigate();

  const emergencyOptions = [
    {
      title: "Call Platform Helpline",
      description: "Workers can contact the LocalFix support team.",
      icon: UserRound,
      color: "bg-blue-500",
      action: () => window.open("tel:1800-123-4567"),
    },
    {
      title: "Call Police",
      description: "In case of security or safety threats.",
      icon: ShieldAlert,
      color: "bg-red-600",
      action: () => window.open("tel:100"),
    },
    {
      title: "Call Ambulance",
      description: "In case of medical emergency.",
      icon: Siren,
      color: "bg-red-500",
      action: () => window.open("tel:108"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground mb-12 hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-500/10"
          >
            <ShieldAlert className="w-12 h-12 text-red-600" />
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-display font-black text-foreground mb-2"
          >
            Are you in an emergency?
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-sm max-w-[250px]"
          >
            Use these options only in emergency situations.
          </motion.p>
        </div>

        <div className="space-y-4 px-2">
          {emergencyOptions.map((option, idx) => (
            <motion.button
              key={option.title}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              onClick={option.action}
              className="w-full glass-card p-5 flex items-center gap-4 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-2xl ${option.color} flex items-center justify-center text-white shadow-lg`}>
                <option.icon className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-foreground text-base">
                  {option.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {option.description}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-12 p-6 bg-red-50 rounded-3xl border border-red-100 text-center">
          <p className="text-[10px] text-red-700 font-bold uppercase tracking-widest mb-1">Important Safety Tip</p>
          <p className="text-xs text-red-600 leading-relaxed">
            Your location will be automatically shared with the platform if you trigger an emergency call.
          </p>
        </div>
      </div>
    </div>
  );
}
