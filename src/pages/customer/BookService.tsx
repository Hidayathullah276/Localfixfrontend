import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ServiceIcon } from "@/components/ServiceIcon";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Zap, CheckCircle2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/useGeolocation";

export default function BookService() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [scheduledHours, setScheduledHours] = useState(1);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const { detectLocation, loading: locating, coords, address: detectedAddress } = useGeolocation();
  const [locationCoords, setLocationCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (detectedAddress) {
      setAddress(detectedAddress);
    }
    if (coords) {
      setLocationCoords([coords.longitude, coords.latitude]);
    }
  }, [detectedAddress, coords]);

  useEffect(() => {
    if (id) {
      api.get(`/services/${id}`)
        .then((data) => {
          if (data) setService(data);
        })
        .catch(err => console.error("Failed to fetch service", err));
    }
  }, [id]);

  // Auto-detect location on mount
  useEffect(() => {
    if (!address) {
      detectLocation();
    }
  }, []);

  const handleDetectLocation = () => {
    detectLocation();
  };

  // Compute pricing — safe to do before return since service may be null (values default to 0)
  const visitFee = service?.visit_fee || 150;
  const hourlyRate = service?.hourly_rate || 120;
  const minGuarantee = service?.min_guarantee || 250;
  const baseServiceCharge = visitFee + (hourlyRate * scheduledHours);
  const estimatedServicePrice = Math.max(baseServiceCharge, minGuarantee);
  const platformFee = 20;
  const total = estimatedServicePrice + platformFee;

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleBook = async () => {
    if (!address.trim()) {
      toast.error("Please enter your address");
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      await api.post("/bookings", {
        customer_id: user.id || (user as any)._id,
        service_id: service.id || service._id,
        address,
        location: locationCoords ? { type: "Point", coordinates: locationCoords } : undefined,
        notes,
        is_emergency: isEmergency,
        service_price: estimatedServicePrice, // initial estimate
        visit_fee: visitFee,
        hourly_rate: hourlyRate,
        min_guarantee: minGuarantee,
        platform_fee: platformFee,
        total_price: total,
        scheduled_hours: scheduledHours
      });
      setBooked(true);
      toast.success("Booking confirmed!");
    } catch (error) {
      toast.error("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (booked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-secondary" />
          </motion.div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            We're finding the best worker near you. You'll be notified once assigned.
          </p>
          <button onClick={() => navigate("/bookings")} className="btn-primary-gradient">
            View My Bookings
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero p-6 pb-12 rounded-b-[2rem]">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
            <ServiceIcon icon={service.icon || "Wrench"} className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-primary-foreground">{service.name}</h1>
            <p className="text-primary-foreground/70 text-sm">{service.description}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4 pb-8">
        {/* Pricing Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Estimate Duration</h3>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
              {[1, 2, 3, 4, 5].map((h) => (
                <button
                  key={h}
                  onClick={() => setScheduledHours(h)}
                  className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${scheduledHours === h
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-muted"
                    }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visit Fee</span>
              <span className="font-semibold text-foreground">₹{visitFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Work Charge ({scheduledHours}h est.)</span>
              <span className="font-semibold text-foreground">₹{hourlyRate * scheduledHours}</span>
            </div>
            {baseServiceCharge < minGuarantee && (
              <div className="flex justify-between text-secondary">
                <span>Min Guarantee Adjustment</span>
                <span className="font-semibold">+₹{minGuarantee - baseServiceCharge}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform fee</span>
              <span className="font-semibold text-foreground">₹{platformFee}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-semibold text-foreground">Estimated Total</span>
              <span className="text-lg font-bold gradient-text">₹{total}</span>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-3 italic">
            * Final bill = Visit Fee (₹{visitFee}) + Work Charge (₹{hourlyRate}/hr). Minimum bill of ₹{minGuarantee} applies.
          </p>

          {service.emergency_price && (
            <button
              onClick={() => setIsEmergency(!isEmergency)}
              className={`mt-4 w-full flex items-center gap-2 p-3 rounded-xl border transition-all ${isEmergency
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border text-muted-foreground hover:border-destructive/50"
                }`}
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Emergency Service (+₹{service.emergency_price - service.base_price})</span>
            </button>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Your Location
            </h3>
            <button
              onClick={handleDetectLocation}
              disabled={locating}
              className="text-xs font-bold text-primary flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Navigation className={`w-3 h-3 ${locating ? "animate-pulse" : ""}`} />
              {locating ? "Locating..." : "Auto-detect"}
            </button>
          </div>
          <Input
            placeholder="Enter your full address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mb-2"
          />
          {locationCoords && (
            <p className="text-[10px] text-muted-foreground mb-2 px-1">
              Captured: {locationCoords[1].toFixed(6)}°N, {locationCoords[0].toFixed(6)}°E
            </p>
          )}
          <Input
            placeholder="Any special notes for the worker? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-5 h-5 text-secondary" />
            <div>
              <p className="font-medium text-foreground">Quick Assignment</p>
              <p className="text-muted-foreground text-xs">Workers within 3km will be notified instantly</p>
            </div>
          </div>
        </motion.div>

        {/* Book Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleBook}
          disabled={loading}
          className="w-full btn-primary-gradient text-lg py-4"
        >
          {loading ? "Booking..." : `Book Now — ₹${total}`}
        </motion.button>
      </div>
    </div>
  );
}
