import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, MapPin, IndianRupee, Clock, Zap, X, Check } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface JobAlertProps {
  booking: any;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onClose: () => void;
}

export function JobAlert({ booking, onAccept, onReject, onClose }: JobAlertProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Permission Request logic is usually triggered outside,
    // but here we ensure audio plays when mounted
    const playSound = async () => {
      try {
        // Using a standard, clean alert sound URL
        audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audioRef.current.loop = true;
        await audioRef.current.play();
      } catch (error) {
        console.warn("Audio playback failed. User interaction might be required.", error);
      }
    };

    const startVibration = () => {
      if ("vibrate" in navigator) {
        // Pattern: Vibrate 500ms, Pause 500ms
        navigator.vibrate([500, 500]);
        vibrationIntervalRef.current = setInterval(() => {
          navigator.vibrate([500, 500]);
        }, 1000);
      }
    };

    playSound();
    startVibration();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      stopAlertEffects();
      clearInterval(timer);
    };
  }, []);

  const stopAlertEffects = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
    }
    if ("vibrate" in navigator) {
      navigator.vibrate(0);
    }
  };

  const handleAutoReject = async () => {
    stopAlertEffects();
    try {
      await api.post(`/bookings/${booking.id || booking._id}/auto-reject`, {});
      toast.error("Job request expired", {
        description: "You didn't respond in time."
      });
    } catch (error) {
      console.error("Auto-reject failed", error);
    }
    onClose();
  };

  const handleAccept = () => {
    stopAlertEffects();
    onAccept(booking.id || booking._id);
  };

  const handleReject = () => {
    stopAlertEffects();
    onReject(booking.id || booking._id);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-sm overflow-hidden bg-card border shadow-2xl rounded-[2.5rem]"
        >
          {/* Header with Pulsing Animation */}
          <div className="relative p-8 pb-6 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-700 opacity-90" />
            
            {/* Pulsing rings logic */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full animate-ping opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/20 rounded-full animate-pulse opacity-20" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-lg animate-bounce">
                <Bell className="w-8 h-8 text-white fill-white/20" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-1">New Job Request</h2>
              <p className="text-white/70 text-sm">Accept within <span className="text-white font-bold">{timeLeft} seconds</span></p>
            </div>
          </div>

          <div className="p-8 pt-6 space-y-6">
            {/* Job Details Card */}
            <div className="glass-card p-4 space-y-3 bg-muted/30 border-muted">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-bold text-foreground">{(booking.service_categories as any)?.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Offer</p>
                  <p className="text-lg font-display font-bold text-emerald-600">₹{booking.total_price}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-muted/50">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Near You</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Immediate</span>
                </div>
              </div>
            </div>

            {/* Countdown Bar */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: `${(timeLeft / 15) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
                className={`h-full ${timeLeft < 5 ? 'bg-red-500' : 'bg-primary'}`}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleReject}
                className="group h-14 flex items-center justify-center gap-2 rounded-2xl bg-muted text-muted-foreground font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="h-14 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 relative overflow-hidden group"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                <Check className="w-5 h-5" />
                Accept Job
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
