import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageSquare, Clock, CheckCircle2, Send, ChevronRight, User } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function UserTickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await api.get("/support/tickets");
      setTickets(data || []);
    } catch (error) {
      toast.error("Failed to load your tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      await api.post(`/support/ticket/${selectedTicket._id}/message`, { message: newMessage });
      setNewMessage("");
      // Refresh tickets to get new message
      const data = await api.get("/support/tickets");
      setTickets(data || []);
      const updated = data.find((t: any) => t._id === selectedTicket._id);
      if (updated) setSelectedTicket(updated);
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="gradient-hero p-6 pb-20 rounded-b-[2.5rem]">
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-display font-bold text-white mb-2">My Support Tickets</h1>
        <p className="text-white/80 text-sm">Track your issues and communicate with support.</p>
      </div>

      <div className="px-6 -mt-10">
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">You haven't raised any tickets yet.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
            </div>
          ) : (
            tickets.map((t) => (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedTicket(t)}
                className="glass-card p-4 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-primary font-mono bg-primary/5 px-2 py-0.5 rounded">
                    #{t.ticketId}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    t.status === 'Open' ? 'bg-red-100 text-red-700' : 
                    t.status === 'In Progress' ? 'bg-orange-100 text-orange-700' : 
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {t.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-sm mb-1">{t.topic}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{t.description}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 text-primary font-bold group-hover:translate-x-1 transition-transform">
                    View & Chat <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Ticket Chat Dialog (Full Screen Mobile style) */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            <div className="p-4 border-b flex items-center gap-4">
              <button 
                onClick={() => setSelectedTicket(null)}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-bold text-sm">#{selectedTicket.ticketId}</h2>
                <p className="text-[10px] text-muted-foreground">{selectedTicket.topic}</p>
              </div>
              <div className="ml-auto">
                 <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  selectedTicket.status === 'Open' ? 'bg-red-100 text-red-700' : 
                  selectedTicket.status === 'In Progress' ? 'bg-orange-100 text-orange-700' : 
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {selectedTicket.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {/* Original Description */}
               <div className="bg-muted/30 p-4 rounded-2xl border-l-4 border-primary">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Your Issue</p>
                  <p className="text-sm text-foreground">{selectedTicket.description}</p>
               </div>

               {/* Messages */}
               <div className="space-y-4">
                  {selectedTicket.messages?.map((msg: any, i: number) => {
                    const isAdmin = msg.senderId !== (user?.id || (user as any)?._id);
                    return (
                      <div key={i} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {isAdmin && <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold">A</div>}
                          <span className="text-[9px] text-muted-foreground">{isAdmin ? 'Support Agent' : 'You'}</span>
                        </div>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                          isAdmin 
                            ? 'bg-muted text-foreground rounded-tl-none' 
                            : 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/20'
                        }`}>
                          {msg.message}
                        </div>
                        <span className="text-[8px] text-muted-foreground mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
               </div>
            </div>

            <div className="p-4 border-t bg-card">
               {selectedTicket.status === 'Resolved' ? (
                 <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                    <p className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-2">
                       <CheckCircle2 className="w-4 h-4" /> Support ticket has been resolved.
                    </p>
                 </div>
               ) : (
                <div className="flex gap-2">
                  <Input 
                    placeholder="Describe further or reply..." 
                    className="h-12 rounded-2xl bg-muted/50 border-none focus:ring-2 focus:ring-primary/40"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button 
                    className="h-12 w-12 shrink-0 rounded-2xl btn-primary-gradient p-0"
                    onClick={handleSendMessage}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
