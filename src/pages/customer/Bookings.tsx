import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { motion } from "framer-motion";
import { Calendar, MapPin, IndianRupee, Clock, Star, PhoneCall, PersonStanding, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  requested: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  worker_arriving: "bg-indigo-100 text-indigo-700",
  service_started: "bg-purple-100 text-purple-700",
  price_negotiated: "bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse",
  work_finished: "bg-amber-100 text-amber-700 border border-amber-200 animate-pulse",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingBooking, setRatingBooking] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingBooking, setConfirmingBooking] = useState<any>(null);
  const [trackingBooking, setTrackingBooking] = useState<any>(null);

  const fetchBookings = () => {
    if (!user) return;
    api.get(`/bookings/customer`)
      .then((data) => {
        if (data) {
          setBookings(data);
          // Update trackingBooking if it's currently open
          if (trackingBooking) {
            const updated = data.find((b: any) => (b.id || b._id) === (trackingBooking.id || trackingBooking._id));
            if (updated) setTrackingBooking(updated);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch bookings", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000); // Poll every 10s for updates
    return () => clearInterval(interval);
  }, [user]);

  const handleSubmitRating = async () => {
    if (!ratingBooking) return;
    setIsSubmitting(true);
    try {
      await api.post(`/bookings/${ratingBooking.id || ratingBooking._id}/rate`, {
        rating,
        review
      });
      toast.success("Thank you for your rating!");
      setRatingBooking(null);
      setRating(5);
      setReview("");
      fetchBookings();
    } catch (error) {
      toast.error("Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirmingBooking) return;
    setIsSubmitting(true);
    try {
      await api.put(`/bookings/${confirmingBooking.id || confirmingBooking._id}`, {
        status: "completed"
      });
      toast.success("Payment confirmed! Thank you.");
      setConfirmingBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error("Failed to confirm payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBillDetails = (booking: any) => {
    if (!booking) return null;
    const start = new Date(booking.started_at).getTime();
    const end = new Date(booking.completed_at).getTime();
    const diffMs = end - start;
    const hours = Math.max(0, diffMs / 3600000);

    const visitFee = booking.visit_fee || 150;
    const hourlyRate = booking.hourly_rate || 120;
    const minGuarantee = booking.min_guarantee || 250;

    const workCharge = hourlyRate * hours;

    return {
      hours: hours.toFixed(2),
      visitFee,
      workCharge: workCharge.toFixed(2),
      minGuarantee,
      final: booking.service_price,
      total: booking.total_price
    };
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="p-6">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">My Bookings</h1>
        <p className="text-sm text-muted-foreground mb-6">Track and manage your service requests</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-4 h-28 animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display font-semibold text-foreground mb-1">No bookings yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Book your first service to get started</p>
            <Link to="/" className="btn-primary-gradient inline-block">Browse Services</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking, i) => (
              <motion.div
                key={booking.id || booking._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-hover p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">
                      {(booking.service_categories as any)?.name || "Service"}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {booking.status === 'completed'
                        ? `Completed on ${new Date(booking.completed_at || booking.updatedAt).toLocaleDateString()}`
                        : `Booked on ${new Date(booking.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[booking.status] || ""}`}>
                    {booking.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {booking.address}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <div className="flex flex-col gap-0.5 w-full">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-foreground flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3" /> {(booking.total_price || 0).toFixed(2)}
                        {booking.status !== 'completed' && <span className="text-[9px] text-muted-foreground font-normal ml-1">(Est.)</span>}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {booking.scheduled_hours}h booked
                      </span>
                    </div>

                    <div className="flex items-center justify-between w-full mt-1">
                      {booking.worker_id ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground uppercase font-mono tracking-tight">
                            Fixer: {booking.worker_info?.name || booking.worker_id.worker_id_code}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5 text-[9px] text-amber-500 font-bold">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              {booking.worker_info?.rating || booking.worker_id.rating || 'N/A'}
                            </div>
                            <span className="text-[9px] text-muted-foreground">
                              • {booking.worker_info?.experience || 0} yrs exp
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[9px] text-amber-600 animate-pulse font-medium">Finding Best Fixer...</span>
                      )}

                      <div className="text-right">
                        {booking.started_at && booking.status !== 'completed' && (
                          <span className="block text-[9px] text-primary font-bold animate-pulse">
                            Work Started: {new Date(booking.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {booking.accepted_at && !booking.started_at && (
                          <span className="block text-[9px] text-emerald-600 font-medium">
                            Confirmed: {new Date(booking.accepted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {['accepted', 'worker_arriving'].includes(booking.status) && (
                    <>
                      <a
                        href={`tel:${booking.worker_info?.phone}`}
                        className="h-7 px-3 flex items-center gap-1.5 text-[10px] bg-blue-500 text-white rounded-lg font-bold shadow-sm"
                      >
                        <PhoneCall className="w-3 h-3" /> Call
                      </a>
                      <Button
                        size="sm"
                        className="h-7 text-[10px] bg-indigo-500 text-white hover:bg-indigo-600"
                        onClick={() => navigate(`/customer/tracking/${booking.id || booking._id}`)}
                      >
                        Track Worker
                      </Button>
                    </>
                  )}
                  {booking.status === 'work_finished' && (
                    <Button
                      size="sm"
                      className="h-7 text-[10px] btn-primary-gradient"
                      onClick={() => setConfirmingBooking(booking)}
                    >
                      Confirm Completion
                    </Button>
                  )}
                  {booking.status === 'completed' && !booking.rating && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      onClick={() => setRatingBooking(booking)}
                    >
                      <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                      Rate Worker
                    </Button>
                  )}
                  {booking.rating && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-bold">{booking.rating}</span>
                    </div>
                  )}
                  {booking.is_emergency && (
                    <span className="text-[10px] font-medium text-destructive">⚡ Emergency</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!ratingBooking} onOpenChange={() => setRatingBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-display">Rate your experience</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform active:scale-90"
                >
                  <Star
                    className={`w-8 h-8 ${star <= rating
                      ? "fill-amber-500 text-amber-500"
                      : "text-muted-foreground opacity-30"
                      }`}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground px-1">Share more details (optional)</label>
              <Textarea
                placeholder="How was the service? Any feedback for the fixer?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="resize-none h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full btn-primary-gradient"
              onClick={handleSubmitRating}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmingBooking} onOpenChange={() => setConfirmingBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-display">Service Summary</DialogTitle>
          </DialogHeader>
          {confirmingBooking && (
            <div className="py-4 space-y-4">
              <div className="glass-card p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Visit Fee</span>
                  <span className="font-semibold text-foreground">₹{getBillDetails(confirmingBooking)?.visitFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Work Duration</span>
                  <span className="font-semibold text-foreground">{getBillDetails(confirmingBooking)?.hours} hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Work Charge</span>
                  <span className="font-semibold text-foreground">₹{getBillDetails(confirmingBooking)?.workCharge}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span className="text-foreground">Calculated Service Price</span>
                  <span className="text-foreground">₹{(Number(getBillDetails(confirmingBooking)?.visitFee) + Number(getBillDetails(confirmingBooking)?.workCharge)).toFixed(2)}</span>
                </div>
                {Number(getBillDetails(confirmingBooking)?.final) > (Number(getBillDetails(confirmingBooking)?.visitFee) + Number(getBillDetails(confirmingBooking)?.workCharge)) && (
                  <div className="bg-secondary/10 p-2 rounded-lg text-[10px] text-secondary font-medium">
                    Note: Minimum guarantee of ₹{getBillDetails(confirmingBooking)?.minGuarantee} applied.
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{confirmingBooking.is_emergency ? 'Platform Fee (Waived)' : 'Platform Fee'}</span>
                  <span className={confirmingBooking.is_emergency ? 'text-green-600 font-bold' : ''}>₹{(confirmingBooking.platform_fee || 0).toFixed(2)}</span>
                </div>
                <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
                  <span className="text-lg font-display font-bold text-foreground">Final Total</span>
                  <span className="text-2xl font-display font-bold gradient-text">₹{confirmingBooking.total_price.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-[10px] text-center text-muted-foreground italic">
                By confirming, you agree that the service was completed to your satisfaction.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              className="w-full btn-primary-gradient h-12 text-lg shadow-lg shadow-primary/20"
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Confirm & Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!trackingBooking} onOpenChange={() => setTrackingBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-display">Track Your Fixer</DialogTitle>
          </DialogHeader>
          {trackingBooking && (
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-4 p-4 glass-card">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center overflow-hidden border border-secondary/20">
                  {trackingBooking.worker_info?.photo ? (
                    <img src={trackingBooking.worker_info.photo} alt="Worker" className="w-full h-full object-cover" />
                  ) : (
                    <PersonStanding className="w-8 h-8 text-secondary" />
                  )}
                </div>
                <div>
                  <h4 className="font-display font-bold text-foreground">{trackingBooking.worker_info?.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-500 font-bold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-current" /> {trackingBooking.worker_info?.rating}
                    </span>
                    <span className="text-[10px] text-muted-foreground">• {trackingBooking.worker_info?.experience} yrs exp</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-tight flex items-center gap-1.5">
                    {trackingBooking.worker_info?.is_online ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Worker is Online
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-muted" />
                        Worker is Offline
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center">
                {/* Mock Map View */}
                <div className="absolute inset-0 bg-[#f8f9fa] flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <MapPin className="w-8 h-8 text-primary mx-auto animate-bounce" />
                    <p className="text-[10px] font-bold text-foreground">Live Tracking Active</p>
                    <p className="text-[9px] text-muted-foreground">Estimated Arrival: 12-15 mins</p>
                  </div>
                </div>
                {/* Button to open real map */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-4 right-4 text-[10px] h-8"
                  onClick={() => {
                    const coords = trackingBooking.worker_info?.location?.coordinates;
                    if (coords && coords.length === 2) {
                      window.open(`https://www.google.com/maps?q=${coords[1]},${coords[0]}`, '_blank');
                    } else {
                      toast.error("Worker's live location is not yet available. They might be offline or still starting.");
                    }
                  }}
                >
                  Open in Google Maps
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${trackingBooking.worker_info?.phone}`}
                  className="flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                >
                  <PhoneCall className="w-4 h-4" /> Call Worker
                </a>
                <div className="bg-secondary/10 rounded-xl p-3 text-center flex flex-col justify-center">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Status</p>
                  <p className="text-xs font-bold text-secondary">{trackingBooking.status.replace('_', ' ').toUpperCase()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
