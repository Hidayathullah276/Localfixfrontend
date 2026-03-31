import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function SupportForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const topic = queryParams.get("topic") || "General Support";
  const role = queryParams.get("role") || "customer";
  const bookingId = queryParams.get("bookingId");

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    setLoading(true);
    try {
      await api.post("/support/ticket", {
        role,
        topic,
        description,
        bookingId: bookingId || undefined
      });
      setSubmitted(true);
      toast.success("Support ticket raised successfully");
    } catch (error: any) {
      console.error("SUPPORT TICKET SUBMIT ERROR:", error);
      if (error.data) console.error("SERVER ERROR DATA:", error.data);
      const detail = error.data?.details || error.message;
      toast.error(`Support Ticket Failed: ${detail || "Internal Server Error"}`);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-10 max-w-sm w-full"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Ticket Raised!</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Our support team will review your request and get back to you shortly.
          </p>
          <button
            onClick={() => navigate(-2)}
            className="w-full btn-primary-gradient py-4 rounded-2xl font-bold"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="gradient-hero p-6 pb-20 rounded-b-[2.5rem]">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-display font-bold text-white mb-2">Raise Support Ticket</h1>
        <p className="text-white/80 text-sm">Topic: {topic}</p>
      </div>

      <div className="px-6 -mt-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-card p-6 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Describe your issue
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide details about the problem you are facing..."
                className="w-full h-40 p-4 rounded-2xl bg-muted/50 border-none focus:ring-2 focus:ring-primary/40 transition-all resize-none text-sm"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full btn-primary-gradient py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Ticket
                </>
              )}
            </button>
          </form>
        </motion.div>

        <div className="mt-8 p-6 bg-primary/5 rounded-3xl border border-primary/10">
          <h3 className="text-sm font-bold text-primary mb-2">Estimated Response Time</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Standard support tickets are usually reviewed within 2-4 business hours. For urgent matters, please use the emergency options if available.
          </p>
        </div>
      </div>
    </div>
  );
}
