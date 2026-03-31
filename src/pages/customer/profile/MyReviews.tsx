import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Star, Calendar, User, Trash2, Edit2, ArrowLeft, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function MyReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const data = await api.get("/bookings/customer");
      // Filter only bookings with ratings
      const ratedBookings = data.filter((b: any) => b.rating);
      setReviews(ratedBookings);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user]);

  const handleUpdateReview = async () => {
    if (!editingReview) return;
    setIsSubmitting(true);
    try {
      await api.post(`/bookings/${editingReview.id || editingReview._id}/rate`, {
        rating: newRating,
        review: newComment
      });
      toast.success("Review updated successfully");
      setEditingReview(null);
      fetchReviews();
    } catch (error) {
      toast.error("Failed to update review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      // In this system, deleting a review might just mean setting rating to null
      await api.post(`/bookings/${bookingId}/rate`, {
        rating: null,
        review: ""
      });
      toast.success("Review deleted");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="gradient-hero p-6 pb-12 rounded-b-[2rem] sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate("/profile")}
            className="p-2 rounded-full bg-white/20 backdrop-blur text-white active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold text-white">My Reviews</h1>
        </div>
        <p className="text-white/80 text-sm">Manage your feedback for services</p>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 glass-card animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 shadow-xl">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
            <h3 className="font-display font-semibold text-foreground mb-1">No reviews yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Your service reviews will appear here</p>
            <Button onClick={() => navigate("/")} className="btn-primary-gradient">
              Book a Service
            </Button>
          </div>
        ) : (
          reviews.map((review, i) => (
            <motion.div
              key={review.id || review._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{review.worker_info?.name || "Fixer"}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {(review.service_categories as any)?.name || "Service"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-bold text-amber-700">{review.rating}</span>
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                <p className="text-sm text-foreground italic">"{review.review || "No comment provided"}"</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[10px]">{new Date(review.completed_at || review.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingReview(review);
                      setNewRating(review.rating);
                      setNewComment(review.review || "");
                    }}
                    className="p-2 rounded-lg hover:bg-muted text-primary transition-colors active:scale-90"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteReview(review.id || review._id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
        <DialogContent className="sm:max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-center font-display text-xl">Edit Review</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setNewRating(star)}
                  className="p-1 transition-transform active:scale-90 hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${star <= newRating
                      ? "fill-amber-500 text-amber-500"
                      : "text-muted-foreground opacity-20"
                      }`}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Your Feedback</label>
              <Textarea
                placeholder="Share your experience..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="resize-none h-32 rounded-2xl border-border bg-muted/50 focus:bg-background transition-all"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-12"
              onClick={() => setEditingReview(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 btn-primary-gradient rounded-xl h-12"
              onClick={handleUpdateReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
