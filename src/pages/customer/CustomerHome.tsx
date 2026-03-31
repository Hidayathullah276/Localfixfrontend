import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ServiceIcon } from "@/components/ServiceIcon";
import { BottomNav } from "@/components/BottomNav";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationsDialog } from "@/components/NotificationsDialog";
import { MapPin, Bell, Search, Star, ArrowRight, Zap, Wrench, Sparkles, Home, Truck, Thermometer, Hammer, ChevronRight, HelpCircle, Loader2 } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "sonner";

interface ServiceCategory {
  _id: string;
  name: string;
  description: string | null;
  icon: string | null;
  base_price: number;
  emergency_price: number | null;
}

export default function CustomerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { detectLocation, loading: locating, address } = useGeolocation();

  useEffect(() => {
    if (address) {
      setSearchQuery(address);
    }
  }, [address]);

  useEffect(() => {
    api.get("/services")
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen pb-20 bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative w-full min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/images/hero-bg.png"
            alt="Home Services"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 gradient-hero mix-blend-multiply opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 py-20 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white leading-tight mb-6">
                Find Trusted Home <br className="hidden md:block" />
                <span className="text-secondary-foreground underline decoration-secondary decoration-4 underline-offset-8">Services Near You</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 font-medium mb-10 max-w-lg mx-auto lg:mx-0">
                Book verified plumbers, electricians, cleaners and more within minutes. Safe, reliable, and affordable.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <Link
                  to="/services"
                  className="w-full sm:w-auto btn-primary-gradient px-8 py-4 text-base shadow-2xl flex items-center justify-center gap-2 group"
                >
                  Book a Service
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/bookings"
                  className="w-full sm:w-auto btn-secondary-gradient px-8 py-4 text-base flex items-center justify-center gap-2"
                >
                  Explore Services
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Quick Access Grid (Desktop Right) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:grid grid-cols-2 gap-4 max-w-md"
          >
            {[
              { name: 'Plumber', icon: Wrench, color: 'bg-blue-500/20 text-blue-400' },
              { name: 'Electrician', icon: Zap, color: 'bg-amber-500/20 text-amber-400' },
              { name: 'Cleaning', icon: Sparkles, color: 'bg-emerald-500/20 text-emerald-400' },
              { name: 'AC Repair', icon: Thermometer, color: 'bg-red-500/20 text-red-400' },
            ].map((s) => (
              <div key={s.name} className="glass-card p-6 flex flex-col items-center justify-center gap-3 border-white/10 hover:border-white/20 transition-all hover:-translate-y-1 shadow-2xl">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <span className="text-white font-bold text-sm">{s.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Profile/Search Overlay (Mobile style but integrated) */}
      <div className="px-6 -mt-10 relative z-20 container mx-auto">
        <div className="glass-card p-4 md:p-6 shadow-2xl border-white/10">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                placeholder="What service do you need today?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-muted/50 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
              />
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <button 
                onClick={detectLocation}
                disabled={locating}
                className="flex-1 md:w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                title="Detect My Location"
              >
                {locating ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <MapPin className="w-6 h-6 text-primary" />
                )}
              </button>
              <button 
                onClick={() => navigate("/customer/help")}
                className="flex-1 md:w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                title="Help Center"
              >
                <HelpCircle className="w-6 h-6 text-primary" />
              </button>
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="flex-1 md:w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors relative"
              >
                <Bell className="w-6 h-6 text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute top-4 right-4 w-4 h-4 bg-destructive text-[8px] text-white flex items-center justify-center rounded-full border-2 border-card font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Service Quick Access (Mobile Scrollable) */}
      <div className="px-6 mt-8 container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-foreground">Service Categories</h2>
          <Link to="/services" className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-1.5 transition-all">
            See All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
          {[
            { name: 'Plumber', icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50' },
            { name: 'Electrician', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
            { name: 'Bathroom', icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { name: 'House', icon: Home, color: 'text-indigo-500', bg: 'bg-indigo-50' },
            { name: 'Shifting', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50' },
            { name: 'AC Repair', icon: Thermometer, color: 'text-red-500', bg: 'bg-red-50' },
            { name: 'Carpenter', icon: Hammer, color: 'text-orange-500', bg: 'bg-orange-50' },
          ].map((s, idx) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="flex-shrink-0"
            >
              <Link
                to={`/services?category=${s.name.toLowerCase()}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-card-hover border-border/40 min-w-[90px]"
              >
                <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center shadow-inner`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <span className="text-[11px] font-bold text-foreground">{s.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Worker Registration Promotion */}
      <div className="px-4 mt-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl p-6 bg-primary"
        >
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />

          <div className="relative z-10">
            <h2 className="text-xl font-display font-bold text-white mb-2">Want to Earn More?</h2>
            <p className="text-white/80 text-sm mb-4 max-w-[200px]">
              Register as a service provider and start getting jobs today.
            </p>
            <Link
              to="/worker/register"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-white text-primary font-bold text-sm rounded-xl hover:bg-white/90 transition-colors"
            >
              Join as Worker
            </Link>
          </div>

          <div className="absolute bottom-0 right-0 w-32 h-32 opacity-20 transform translate-x-4 translate-y-4">
            <Wrench className="w-full h-full text-white" />
          </div>
        </motion.div>
      </div>

      {/* All Services */}
      <div className="px-4 mt-6">
        <h2 className="font-display font-semibold text-foreground mb-3">All Services</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-4 animate-pulse h-36" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {services.map((service, i) => (
              <motion.div
                key={service._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/book/${service._id}`} className="block glass-card-hover p-4">
                  <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mb-3">
                    <ServiceIcon icon={service.icon || "Wrench"} className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-sm text-foreground">{service.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold gradient-text">₹{service.base_price}</span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-medium">4.8</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
      <NotificationsDialog 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
    </div>
  );
}
