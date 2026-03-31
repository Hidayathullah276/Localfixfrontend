import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, ChevronRight, Calendar, UserX, CreditCard, 
  XSquare, RefreshCcw, AlertTriangle, MessageSquare, ClipboardList 
} from "lucide-react";

export default function CustomerHelpCenter() {
  const navigate = useNavigate();

  const helpTopics = [
    { title: "Booking issue", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Worker not arrived", icon: UserX, color: "text-red-500", bg: "bg-red-50" },
    { title: "Payment issue", icon: CreditCard, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Cancel service request", icon: XSquare, color: "text-slate-500", bg: "bg-slate-50" },
    { title: "Refund issue", icon: RefreshCcw, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Report worker problem", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  const handleTopicClick = (topic: string) => {
    navigate(`/support/ticket?topic=${encodeURIComponent(topic)}&role=customer`);
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="gradient-hero p-6 pb-20 rounded-b-[2.5rem]">
        <button
          onClick={() => navigate("/support/tickets")}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-6 ml-auto"
          title="My Tickets"
        >
          <ClipboardList className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-display font-black text-white mb-2"
        >
          Customer Support Center
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white/80 text-sm"
        >
          We are here to help you with your service.
        </motion.p>
      </div>

      <div className="px-6 -mt-10 space-y-3">
        {helpTopics.map((topic, idx) => (
          <motion.button
            key={topic.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + idx * 0.05 }}
            onClick={() => handleTopicClick(topic.title)}
            className="w-full glass-card p-4 flex items-center gap-4 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div className={`w-12 h-12 rounded-2xl ${topic.bg} flex items-center justify-center ${topic.color}`}>
              <topic.icon className="w-6 h-6" />
            </div>
            <span className="flex-1 font-display font-bold text-foreground text-sm">
              {topic.title}
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.button>
        ))}
      </div>

      <div className="mt-10 px-6">
        <div className="flex items-center gap-3 bg-primary/5 p-5 rounded-3xl border border-primary/10">
          <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Chat with us</h4>
            <p className="text-[11px] text-muted-foreground">Typical response time: 5 minutes</p>
          </div>
          <button className="ml-auto text-primary text-xs font-bold px-4 py-2 bg-white rounded-xl shadow-sm">
            Chat Now
          </button>
        </div>
      </div>
    </div>
  );
}
