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
  const [bookingType, setBookingType] = useState<'hourly' | 'inspection'>('inspection');
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

  useEffect(() => {
    if (!address) {
      detectLocation();
    }
  }, []);

  const handleDetectLocation = () => {
    detectLocation();
  };

  // Model 1 & 2 Pricing Logic
  const platformFee = isEmergency ? 50 : (bookingType === 'inspection' ? 50 : 20);
  const emergencyFee = isEmergency ? 100 : 0;
  
  const visitFee = (bookingType === 'inspection') ? 0 : (service?.visit_fee || 150);
  const hourlyRate = service?.hourly_rate || 120;
  
  // Amount customer pays UPFRONT to platform (Model 1: 50, Model 2: 150 (50+100))
  const upfrontPayable = isEmergency 
    ? (bookingType === 'inspection' ? 150 : 50) 
    : platformFee;
    
  const estimatedWorkCharge = bookingType === 'inspection' ? 0 : (hourlyRate * scheduledHours);
  
  // Total Price is everything: Platform Fee + Emergency Fee + Visit Fee + Work Charge
  const total = platformFee + emergencyFee + visitFee + estimatedWorkCharge;

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
        service_price: estimatedWorkCharge + visitFee,
        visit_fee: visitFee,
        hourly_rate: hourlyRate,
        platform_fee: platformFee,
        emergency_fee: emergencyFee,
        upfront_paid: upfrontPayable,
        total_price: total,
        total_amount: total,
        scheduled_hours: bookingType === 'inspection' ? 0 : scheduledHours,
        booking_type: bookingType
      });
      setBooked(true);
      toast.success(isEmergency 
        ? `Emergency booked! Pay ₹${upfrontPayable} before booking.` 
        : `Service booked! Pay ₹${upfrontPayable} platform fee to confirm.`
      );
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
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card mb-6 p-4 border-2 border-secondary/20"
          >
             <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Payment Details</p>
             <div className="flex justify-between items-center px-4 mb-1">
                <span className="text-sm font-medium">Upfront Paid</span>
                <span className="text-lg font-black text-secondary">₹{upfrontPayable}</span>
             </div>
             <div className="flex justify-between items-center px-4">
                <span className="text-sm font-medium">Remaining to Pay</span>
                <span className="text-lg font-black text-primary">₹{total - upfrontPayable}</span>
             </div>
             <p className="text-[10px] text-muted-foreground mt-3 italic">
               Check "My Bookings" for status updates and fixer details.
             </p>
          </motion.div>
          <button onClick={() => navigate("/bookings")} className="btn-primary-gradient px-8 py-3 rounded-full font-bold">
            View My Bookings
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
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
        {/* Booking Type Selection */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-1.5 flex gap-1.5 bg-muted/30">
           <button 
             onClick={() => setBookingType('inspection')}
             className={`flex-1 p-3 rounded-xl transition-all text-center ${bookingType === 'inspection' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
           >
             <p className="text-xs font-black">Inspection</p>
           </button>
           <button 
             onClick={() => setBookingType('hourly')}
             className={`flex-1 p-3 rounded-xl transition-all text-center ${bookingType === 'hourly' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
           >
             <p className="text-xs font-black">Hourly</p>
           </button>
        </motion.div>

        {isEmergency && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-destructive/90 text-white p-4 rounded-2xl shadow-lg border border-white/10 overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-start gap-3 relative z-10">
               <Zap className="w-5 h-5 fill-white animate-pulse" />
               <div>
                  <p className="text-xs font-bold uppercase tracking-tight">Emergency High Priority</p>
                  <p className="text-[10px] text-white/80 mt-1">⚡ Emergency service ensures faster arrival. Fixing your request is prioritized for instant nearby worker assignment.</p>
               </div>
            </div>
          </motion.div>
        )}

        {/* Pricing Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          {bookingType === 'hourly' && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-sm text-foreground">Estimated Duration</h3>
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                {[1, 2, 3, 4, 5].map((h) => (
                  <button
                    key={h}
                    onClick={() => setScheduledHours(h)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${scheduledHours === h ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
             <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Upfront Platform Fee</span>
                <span className="font-bold text-foreground">₹{isEmergency ? 50 : (bookingType === 'inspection' ? 50 : 20)}</span>
             </div>
             
             {isEmergency && (
                <div className="flex justify-between items-center text-xs">
                   <span className="text-destructive font-black flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-current" /> Emergency Fee
                   </span>
                   <span className="font-bold text-destructive">
                      ₹{emergencyFee} {bookingType === 'inspection' ? "(Pay Now)" : "(Added to Final Bill)"}
                   </span>
                </div>
             )}

             <div className="bg-secondary/5 rounded-2xl p-4 border border-secondary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-[0.03]">
                   <IndianRupee className="w-16 h-16" />
                </div>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Estimated Total Cost</span>
                   <span className="text-sm font-black text-secondary">₹{total}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-secondary/20">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">Pay Now</span>
                      <span className="text-xl font-black text-primary">₹{upfrontPayable}</span>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">Pay After Work</span>
                      <span className="block text-sm font-bold text-foreground">₹{total - upfrontPayable}</span>
                   </div>
                </div>
             </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-4 italic px-1">
            * {isEmergency 
               ? "₹50 Platform fee is required to verify your emergency request. 100% of emergency fee goes to the worker."
               : "Regular booking. Final bill is calculated based on actual service time with a ₹150 min visit fee."}
          </p>

          <button
            onClick={() => setIsEmergency(!isEmergency)}
            className={`mt-4 w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all ${isEmergency
              ? "border-destructive bg-destructive text-white font-black shadow-lg shadow-destructive/20 scale-[1.02]"
              : "border-border text-muted-foreground font-bold hover:border-destructive hover:text-destructive"
              }`}
          >
            <Zap className={`w-4 h-4 ${isEmergency ? 'fill-white' : ''}`} />
            <span className="text-xs uppercase tracking-tight">Emergency Service (+₹100)</span>
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2 text-sm text-primary">
              <MapPin className="w-4 h-4" /> Your Service Location
            </h3>
            <button
              onClick={handleDetectLocation}
              disabled={locating}
              className="text-[10px] font-black text-primary uppercase bg-primary/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
            >
              {locating ? "Locating..." : "Auto-detect"}
            </button>
          </div>
          <Input
            placeholder="House/Flat No, Landmark, Full Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mb-2 text-sm bg-muted/20 border-none h-12 rounded-xl"
          />
          <Input
            placeholder="Any special instructions for the fixer? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-sm bg-muted/20 border-none h-12 rounded-xl"
          />
        </motion.div>

        {/* Info Box */}
        <div className="grid grid-cols-2 gap-3">
           <div className="glass-card p-4 flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                 <Clock className="w-4 h-4 text-secondary" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase">ETA</span>
                 <span className="text-xs font-bold">15-30 mins</span>
              </div>
           </div>
           <div className="glass-card p-4 flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                 <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase">Verified</span>
                 <span className="text-xs font-bold">Expert Fixers</span>
              </div>
           </div>
        </div>

        {/* Book Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleBook}
          disabled={loading}
          className={`w-full text-lg py-4.5 rounded-2xl transition-all shadow-xl active:scale-[0.98] mt-4 ${isEmergency ? 'bg-destructive text-white font-black' : 'btn-primary-gradient'}`}
        >
          {loading ? "Processing..." : `Confirm & Pay ₹${upfrontPayable}`}
        </motion.button>
        <p className="text-center text-muted-foreground text-[10px] mt-2 pb-4">
           Secure payment via platform platform. No extra charges.
        </p>
      </div>
    </div>
  );
}

// Add Missing Import
import { IndianRupee } from "lucide-react";
