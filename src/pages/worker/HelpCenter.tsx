import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, ChevronRight, Wallet, TrendingUp, Receipt, 
  CreditCard, Briefcase, ShieldCheck, UserCog, ClipboardList 
} from "lucide-react";

export default function WorkerHelpCenter() {
  const navigate = useNavigate();

  const helpTopics = [
    { title: "Order earning issue", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Daily incentive issue", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Incentives and payout issue", icon: Receipt, color: "text-purple-500", bg: "bg-purple-50" },
    { title: "Incorrect payout to bank", icon: CreditCard, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Floating cash issue", icon: Wallet, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "Duty related issues", icon: Briefcase, color: "text-orange-500", bg: "bg-orange-50" },
    { title: "Insurance benefits", icon: ShieldCheck, color: "text-red-500", bg: "bg-red-50" },
  ];

  const handleTopicClick = (topic: string) => {
    navigate(`/support/ticket?topic=${encodeURIComponent(topic)}&role=worker`);
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
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-display font-black text-white mb-2"
        >
          Welcome to the <br /> LocalFix Worker Help Center
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white/80 text-sm"
        >
          Need help? Our support team is here for you.
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

      <div className="mt-8 px-6">
        <div className="glass-card p-6 border-dashed border-2 border-muted-foreground/20 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <UserCog className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-foreground text-sm mb-1">Other Issues?</h3>
          <p className="text-xs text-muted-foreground mb-4">
            If your issue is not listed above, you can still raise a general support ticket.
          </p>
          <button
            onClick={() => handleTopicClick("General Worker Support")}
            className="text-primary font-bold text-xs underline underline-offset-4"
          >
            Raise General Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
