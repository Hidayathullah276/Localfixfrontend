import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Power, MapPin, Star, Briefcase, IndianRupee, Clock, CheckCircle2, XCircle,
  ArrowLeft, TrendingUp, User, RotateCcw, Zap, PhoneCall, Navigation, ShieldAlert, HelpCircle, Bell
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationsDialog } from "@/components/NotificationsDialog";
import { toast } from "sonner";
import { socket } from "@/lib/socket";
import { JobAlert } from "@/components/JobAlert";
import { Button } from "@/components/ui/button";

export default function WorkerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [worker, setWorker] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJobRequest, setActiveJobRequest] = useState<any>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(true); // Assume true, check on interaction
  const knownJobIdsRef = useRef<Set<string>>(new Set());
  const lastCheckCountRef = useRef(0);

  const loadData = async (isBackground = false) => {
    try {
      const w = await api.get(`/workers/me`);
      if (w) {
        setWorker(w);
        const [assigned, available] = await Promise.all([
          api.get(`/bookings/worker/${w.id || w._id}`),
          api.get(`/bookings/available`)
        ]);
        if (assigned) setBookings(assigned);
        if (available) {
          setAvailableJobs(available);
          const currentIds = available.map((b: any) => b.id || b._id);
          knownJobIdsRef.current = new Set(currentIds);
        }
      }
    } catch (error) {
      console.error("Failed to load worker data", error);
      if (!isBackground) {
        toast.error("Failed to load dashboard data. Check network.");
      }
    }
    if (!isBackground) setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    loadData(false);

    // Initial polling
    const interval = setInterval(() => loadData(true), 60000); 
    return () => clearInterval(interval);
  }, [user]);

  // Real-time socket listener
  useEffect(() => {
    if (!worker?.is_online) return;

    const handleNewBooking = (data: any) => {
      // Re-fetch available jobs to see if it matches worker skills
      loadData(true).then(() => {
        toast.info("A new service request is available nearby!", {
          duration: 5000,
          action: {
            label: "View",
            onClick: () => window.scrollTo({ top: 0, behavior: "smooth" })
          }
        });
      });
    };

    socket.on('new_booking_created', handleNewBooking);

    const handleJobRequest = (data: any) => {
      // Don't show if already seeing one
      if (activeJobRequest) return;
      
      // Fetch details then show alert
      api.get(`/bookings/${data.bookingId}`).then(booking => {
          if (booking && booking.status === 'requested') {
            setActiveJobRequest(booking);
          }
      });
    };

    socket.on('new_job_request', handleJobRequest);

    return () => {
      socket.off('new_booking_created', handleNewBooking);
      socket.off('new_job_request', handleJobRequest);
    };
  }, [worker?.is_online, activeJobRequest]);

  const requestPermissions = async () => {
    try {
      // 1. Notification Permission
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error("Enable notifications to receive job alerts.");
        }
      }
      
      // 2. Audio/Vibration on mobile often requires user interaction
      // This click handler satisfies that
      const dummyAudio = new Audio();
      await dummyAudio.play().catch(() => {});
      
      setPermissionsGranted(true);
      toast.success("Ready to receive job alerts!");
    } catch (error) {
      toast.error("Failed to request permissions");
    }
  };

  // Real-time location tracking
  useEffect(() => {
    if (!worker?.is_online || !("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        api.put("/workers/location", { coordinates: [longitude, latitude] }).catch(console.error);
      },
      (err) => console.error("Location error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [worker?.is_online]);

  const { unreadCount } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const toggleOnline = async () => {
    if (!worker) return;
    const workerId = worker.id || worker._id;
    const newStatus = !worker.is_online;
    try {
      await api.put(`/workers/${workerId}`, { is_online: newStatus });
      setWorker({ ...worker, is_online: newStatus });
      toast.success(newStatus ? "You're now online!" : "You're now offline");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleAcceptJob = async (bookingId: string) => {
    try {
      const workerId = worker.id || worker._id;
      await api.put(`/bookings/${bookingId}`, {
        status: "accepted",
        accepted_at: new Date().toISOString(),
        worker_id: workerId
      });
      toast.success("Job accepted!");
      // Refresh all data
      const [w, assigned, available] = await Promise.all([
        api.get(`/workers/me`),
        api.get(`/bookings/worker/${workerId}`),
        api.get(`/bookings/available`)
      ]);
      if (w) setWorker(w);
      if (assigned) setBookings(assigned);
      if (available) setAvailableJobs(available);
      
      // Redirect to Tracking Page
      navigate(`/worker/tracking/${bookingId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to accept job");
      // Immediate refresh to sync the list
      const available = await api.get(`/bookings/available`);
      if (available) setAvailableJobs(available);
    }
  };

  const handleStartJob = async (bookingId: string) => {
    try {
      const workerId = worker.id || worker._id;
      await api.put(`/bookings/${bookingId}`, {
        status: "service_started",
        started_at: new Date().toISOString()
      });
      toast.success("Service started! Timer is running.");
      // Refresh
      const assigned = await api.get(`/bookings/worker/${workerId}`);
      if (assigned) setBookings(assigned);
    } catch (error) {
      toast.error("Failed to start service");
    }
  };

  const handleArriving = async (bookingId: string) => {
    try {
      const workerId = worker.id || worker._id;
      await api.put(`/bookings/${bookingId}`, {
        status: "worker_arriving"
      });
      toast.success("Heading to customer location!");
      // Refresh
      const assigned = await api.get(`/bookings/worker/${workerId}`);
      if (assigned) setBookings(assigned);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleCompleteJob = async (bookingId: string) => {
    if (!confirm("Are you sure you want to finish the work? The final bill will be calculated now.")) return;

    try {
      const workerId = worker.id || worker._id;
      await api.put(`/bookings/${bookingId}`, {
        status: "work_finished"
      });
      toast.success("Work finished! Awaiting customer confirmation.");
      // Refresh
      const [w, assigned] = await Promise.all([
        api.get(`/workers/me`),
        api.get(`/bookings/worker/${workerId}`)
      ]);
      if (w) setWorker(w);
      if (assigned) setBookings(assigned);
    } catch (error) {
      toast.error("Failed to finish work");
    }
  };

  const LiveTimer = ({ startTime, booking }: { startTime: string, booking: any }) => {
    const [elapsed, setElapsed] = useState("");
    const [cost, setCost] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        const diffMs = now - start;

        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);

        setElapsed(`${hours}h ${minutes}m ${seconds}s`);

        // Calculate cost preview
        const durationHours = diffMs / 3600000;
        const visitFee = booking.visit_fee || 150;
        const hourlyRate = booking.hourly_rate || 120;
        const minGuarantee = booking.min_guarantee || 250;

        const calculated = visitFee + (hourlyRate * durationHours);
        setCost(Math.max(calculated, minGuarantee));
      }, 1000);
      return () => clearInterval(interval);
    }, [startTime, booking]);

    return (
      <div className="mt-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Live Timer</span>
          <span className="text-[10px] font-mono text-primary font-bold">{elapsed}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Estimated Bill</span>
          <span className="text-sm font-bold text-foreground">₹{cost.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Not Registered as Worker</h2>
          <p className="text-muted-foreground text-sm mb-4">Register first to access the worker dashboard</p>
          <Link to="/worker/register" className="btn-primary-gradient inline-block">Register Now</Link>
        </div>
      </div>
    );
  }

  if (worker.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Pending Verification</h2>
          <p className="text-muted-foreground text-sm mb-1">Worker ID will be assigned after approval</p>
          <p className="text-xs text-muted-foreground">An admin is reviewing your application</p>
        </motion.div>
      </div>
    );
  }

  if (worker.status === "suspended" || worker.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Account {worker.status}</h2>
          <p className="text-muted-foreground text-sm">Contact support for more info</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="gradient-hero p-6 pb-12 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="text-primary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/worker/emergency")}
              className="w-10 h-10 rounded-full bg-red-400/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-400/30 transition-all hover:scale-110"
              title="Emergency"
            >
              <ShieldAlert className="w-5 h-5 text-red-200" />
            </button>
            <button 
              onClick={() => navigate("/worker/help")}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-110"
              title="Help Center"
            >
              <HelpCircle className="w-5 h-5 text-white/80" />
            </button>
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-110 relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-white/80" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[8px] flex items-center justify-center rounded-full border border-white font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={async () => { await signOut(); navigate("/auth"); }}
              className="text-primary-foreground/70 text-sm ml-2 bg-white/5 px-3 py-1.5 rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
            <User className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-primary-foreground">Worker Dashboard</h1>
            <p className="text-primary-foreground/70 text-xs">ID: {worker.worker_id_code || "Assigned"}</p>
          </div>
        </div>
        
        {/* Penalty Warning / Cooldown */}
        {worker.penalty_until && new Date(worker.penalty_until) > new Date() && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-red-500/10 border-b border-red-500/20 px-6 py-2 flex items-center justify-between text-[10px]"
          >
            <p className="text-red-600 font-bold flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" />
              Account on partial cooldown due to rejection rate.
            </p>
            <span className="text-red-500 font-mono">
              Wait {Math.ceil((new Date(worker.penalty_until).getTime() - Date.now()) / 60000)}m
            </span>
          </motion.div>
        )}
      </div>

      <div className="px-4 -mt-6 space-y-4">
        {/* Permission Request if needed */}
        {("Notification" in window && Notification.permission !== 'granted') && (
          <Button 
            variant="secondary" 
            className="w-full bg-indigo-600/10 text-indigo-700 border-indigo-600/20 gap-2 h-12"
            onClick={requestPermissions}
          >
            <Bell className="w-4 h-4" /> Enable Job Alerts & Sound
          </Button>
        )}
        {/* Online Toggle */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={toggleOnline}
          className={`w-full glass-card p-5 flex items-center justify-between transition-all ${worker.is_online ? "ring-2 ring-secondary" : ""
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${worker.is_online ? "bg-secondary/20" : "bg-muted"
              }`}>
              <Power className={`w-6 h-6 ${worker.is_online ? "text-secondary" : "text-muted-foreground"}`} />
            </div>
            <div className="text-left">
              <p className="font-display font-semibold text-foreground">
                {worker.is_online ? "You're Online" : "You're Offline"}
              </p>
              <p className="text-xs text-muted-foreground">
                {worker.is_online ? "Receiving job requests" : "Go online to receive jobs"}
              </p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors ${worker.is_online ? "bg-secondary" : "bg-muted"
            } relative`}>
            <div className={`w-5 h-5 rounded-full bg-card absolute top-0.5 transition-transform ${worker.is_online ? "translate-x-6" : "translate-x-0.5"
              }`} />
          </div>
        </motion.button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Star, label: "Rating", value: worker.rating || "N/A", color: "text-amber-500" },
            { icon: Zap, label: "Acceptance", value: `${Math.round(((worker.accepted_jobs || 0) / (worker.total_requests || 1)) * 100)}%`, color: "text-indigo-500" },
            { icon: TrendingUp, label: "Jobs Managed", value: worker.total_requests || 0, color: "text-primary" },
            { icon: IndianRupee, label: "Earn Today", value: `₹${worker.earnings_today || 0}`, color: "text-emerald-500" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass-card p-4 flex flex-col items-center justify-center text-center"
            >
              <stat.icon className={`w-5 h-5 mb-1 ${stat.color}`} />
              <p className="text-lg font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Available Jobs */}
        {worker.is_online && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                Available Jobs Near You
              </h3>
              <button
                onClick={() => {
                  setLoading(true);
                  api.get('/bookings/available').then(res => {
                    if (res) {
                      setAvailableJobs(res);
                      knownJobIdsRef.current = new Set(res.map((b: any) => b.id || b._id));
                    }
                    setLoading(false);
                  });
                }}
                className="text-muted-foreground hover:text-primary transition-colors p-1"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            {availableJobs.length === 0 ? (
              <div className="glass-card p-6 text-center text-sm text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No unassigned jobs right now. They'll appear here automatically.
              </div>
            ) : (
              <div className="space-y-3">
                {availableJobs.map((b) => (
                  <motion.div
                    key={b.id || b._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-4 border-l-4 border-l-secondary"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{(b.service_categories as any)?.name}</h4>
                        <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-secondary" />
                          {b.address.split(',').slice(-2).join(',').trim() || "Nearby Area"}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm font-bold text-secondary font-mono">₹{b.total_price}</span>
                          <span className="text-[10px] text-muted-foreground italic">
                            Request from: {(b.customer_id as any)?.full_name || "User"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAcceptJob(b.id || b._id)}
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                      >
                        Accept Job
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Jobs */}
        <div>
          <h3 className="font-display font-semibold text-foreground mb-3">Your Assigned Jobs</h3>
          {bookings.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">No assigned jobs yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b, i) => (
                <motion.div
                  key={b.id || b._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{(b.service_categories as any)?.name}</h4>
                      <p className="text-xs text-muted-foreground">{(b.customer_id as any)?.full_name || "Unknown"} • {(b.customer_id as any)?.phone || "No phone"}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-primary">₹{b.total_price}</span>
                      <span className={`block text-[8px] font-bold px-1.5 py-0.5 mt-1 rounded-full ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {b.address}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-muted-foreground">
                      {b.status === 'completed'
                        ? `Done: ${new Date(b.completed_at || b.updatedAt).toLocaleDateString()}`
                        : `Booked: ${new Date(b.createdAt).toLocaleDateString()}`}
                    </p>
                    {b.started_at && (
                      <p className="text-[9px] text-primary font-medium animate-pulse">
                        In Progress (Started: {new Date(b.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </p>
                    )}
                    {b.accepted_at && !b.started_at && (
                      <p className="text-[9px] text-emerald-600 font-medium">
                        Confirmed: {new Date(b.accepted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                  {['accepted', 'worker_arriving', 'service_started'].includes(b.status) && (
                    <div className="mt-4 space-y-2">
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                          onClick={() => {
                            const coords = b.location?.coordinates;
                            if (coords && coords.length === 2) {
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`, '_blank');
                            } else {
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.address)}`, '_blank');
                              toast.info("Navigating to address (GPS pin missing)");
                            }
                          }}
                          className="w-full bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                        >
                          <Navigation className="w-4 h-4" /> Open Navigation
                        </button>
                        <a
                          href={`tel:${b.customer_id?.phone || ""}`}
                          className="flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors"
                        >
                          <PhoneCall className="w-4 h-4" /> Call Customer
                        </a>
                      </div>


                      {b.status === 'accepted' && (
                        <button
                          onClick={() => handleArriving(b.id || b._id)}
                          className="w-full bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                          <Clock className="w-4 h-4" /> I'm on my way
                        </button>
                      )}

                      {b.status === 'worker_arriving' && (
                        <button
                          onClick={() => handleStartJob(b.id || b._id)}
                          className="w-full bg-primary text-white py-3 rounded-xl text-xs font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4" /> Start Service
                        </button>
                      )}
                    </div>
                  )}
                  {b.status === 'service_started' && (
                    <>
                      <LiveTimer startTime={b.started_at} booking={b} />
                      <button
                        onClick={() => handleCompleteJob(b.id || b._id)}
                        className="mt-3 w-full bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Finish Work
                      </button>
                    </>
                  )}
                  {b.status === 'work_finished' && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                      <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">Work Finished</p>
                      <p className="text-[9px] text-amber-600">Awaiting customer confirmation & payment</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <NotificationsDialog 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />

      {/* New Job Alert Overlay */}
      {activeJobRequest && (
        <JobAlert 
          booking={activeJobRequest}
          onAccept={(id) => {
             handleAcceptJob(id);
             setActiveJobRequest(null);
          }}
          onReject={async (id) => {
             try {
               await api.put(`/bookings/${id}`, { status: 'rejected', worker_id: worker.id || worker._id });
               toast.info("Job request rejected");
               setActiveJobRequest(null);
               loadData(true);
             } catch (err) {
               toast.error("Failed to reject job");
             }
          }}
          onClose={() => {
            setActiveJobRequest(null);
            loadData(true);
          }}
        />
      )}
    </div>
  );
}
