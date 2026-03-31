import { motion } from "framer-motion";
import { ArrowLeft, HelpCircle, ChevronRight, BookOpen, CreditCard, UserX, XCircle, AlertTriangle, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

const supportTopics = [
  { 
    id: "booking", 
    title: "Booking issue", 
    icon: BookOpen, 
    color: "bg-blue-50 text-blue-600",
    topic: "Booking Issue"
  },
  { 
    id: "payment", 
    title: "Payment issue", 
    icon: CreditCard, 
    color: "bg-emerald-50 text-emerald-600",
    topic: "Payment & Refund"
  },
  { 
    id: "worker-not-arrived", 
    title: "Worker not arrived", 
    icon: UserX, 
    color: "bg-amber-50 text-amber-600",
    topic: "Worker Not Arrived"
  },
  { 
    id: "cancel-request", 
    title: "Cancel request", 
    icon: XCircle, 
    color: "bg-red-50 text-red-600",
    topic: "Cancellation Request"
  },
  { 
    id: "report-problem", 
    title: "Report problem", 
    icon: AlertTriangle, 
    color: "bg-purple-50 text-purple-600",
    topic: "Report a Problem"
  },
];

export default function HelpSupport() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="gradient-hero p-6 pb-12 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate("/profile")}
            className="p-2 rounded-full bg-white/20 backdrop-blur text-white active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold text-white">Help & Support</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">How can we help?</p>
            <p className="text-white/70 text-[10px]">Select a topic to get started</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-6">
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Topic</h3>
          </div>
          <div className="divide-y divide-border">
            {supportTopics.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/support/ticket?topic=${encodeURIComponent(item.topic)}&role=customer`)}
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-foreground flex-1 text-left">{item.title}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </motion.button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => navigate("/support/tickets")}
          className="w-full p-4 glass-card flex items-center justify-between group hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">View Raised Tickets</p>
              <p className="text-[10px] text-muted-foreground">Track status of your issues</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Can't find what you're looking for? <br />
            Our support team is available 24/7 for urgent matters.
          </p>
        </div>
      </div>
    </div>
  );
}
