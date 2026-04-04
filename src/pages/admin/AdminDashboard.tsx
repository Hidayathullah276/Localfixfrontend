import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ClipboardList, Settings, BarChart3, CheckCircle2, XCircle,
  ArrowLeft, LogOut, Wrench, IndianRupee, TrendingUp, Clock, Plus, Edit, Trash2, 
  AlertCircle, MessageSquare, Filter, Search, Eye, CheckCircle, ArrowRight, Bell, Phone, ShoppingBag, ShoppingCart, Zap,
  MapPin, ShieldCheck, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { socket } from "@/lib/socket";
import { API_URL } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/SettingsContext";

const SKILL_OPTIONS = ["Plumber", "Electrician", "Bathroom Cleaning", "House Cleaning", "Home Shifting", "AC Repair", "Carpenter"];

export default function AdminDashboard() {
  const { user, roles, signOut } = useAuth();
  const { ecommerceEnabled, refreshSettings, settingsLoading, inspectionFee: currentInspectionFee, hourlyPlatformFee: currentHourlyFee } = useSettings();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketFilterStatus, setTicketFilterStatus] = useState("all");
  const [ticketFilterRole, setTicketFilterRole] = useState("all");
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editingFeeBooking, setEditingFeeBooking] = useState<any | null>(null);
  const [newFeeValue, setNewFeeValue] = useState<string>("");
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [workerSkillsToEdit, setWorkerSkillsToEdit] = useState<string[]>([]);
  const [skillEditWorkerId, setSkillEditWorkerId] = useState<string | null>(null);
  
  const prevBookingsCountRef = useRef(0);
  const [tempFees, setTempFees] = useState({
    inspection: currentInspectionFee,
    hourly: currentHourlyFee
  });
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    icon: "Wrench",
    base_price: 199,
    emergency_price: ""
  });

  useEffect(() => {
    setTempFees({
      inspection: currentInspectionFee,
      hourly: currentHourlyFee
    });
  }, [currentInspectionFee, currentHourlyFee]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeTab, setActiveTab] = useState("workers");
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [shopOrders, setShopOrders] = useState<any[]>([]);
  const [shopOrderFilter, setShopOrderFilter] = useState<"active" | "delivered" | "cancelled">("active");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 99,
    category: "tools",
    stock: 10,
    image: "",
    is_active: true,
  });
  const toAbsoluteUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_URL.replace("/api", "")}${path}`;
  };

  useEffect(() => {
    socket.on('new_worker_application', (data) => {
      setNotificationCount(prev => prev + 1);
      toast.custom((t) => (
        <div className="bg-card border shadow-lg rounded-xl p-4 flex gap-3 slide-in-from-right-1/2 cursor-pointer hover:bg-muted/50 transition-colors"
             onClick={() => { setActiveTab("workers"); toast.dismiss(t); }}>
           <div className="bg-primary/10 p-2 rounded-full h-fit"><Bell className="w-5 h-5 text-primary" /></div>
           <div>
             <h4 className="font-bold text-sm">New Worker Application Received</h4>
             <p className="text-xs text-muted-foreground mt-1">Click to review in Workers tab.</p>
           </div>
        </div>
      ), { duration: 5000 });
      api.get("/workers").then(w => { if (w) setWorkers(w) });
    });

    socket.on('new_booking_created', (data) => {
      setNotificationCount(prev => prev + 1);
      toast.custom((t) => (
        <div className="bg-card border shadow-lg rounded-xl p-4 flex gap-3 slide-in-from-right-1/2 cursor-pointer hover:bg-muted/50 transition-colors"
             onClick={() => { setActiveTab("bookings"); toast.dismiss(t); }}>
           <div className="bg-emerald-500/10 p-2 rounded-full h-fit"><Bell className="w-5 h-5 text-emerald-500" /></div>
           <div>
             <h4 className="font-bold text-sm">New Booking Request</h4>
             <p className="text-xs text-muted-foreground mt-1">Click to review in Bookings tab.</p>
           </div>
        </div>
      ), { duration: 5000 });
      api.get("/bookings").then(b => { if (b) setBookings(b) });
    });

    return () => {
      socket.off('new_worker_application');
      socket.off('new_booking_created');
    };
  }, []);

  useEffect(() => {
    if (!roles.includes("admin")) {
      navigate("/");
      return;
    }

    const load = async (isBackground = false) => {
      try {
        const [w, b, s, t] = await Promise.all([
          api.get("/workers"),
          api.get("/bookings"),
          api.get("/services"),
          api.get("/support/admin/tickets"),
        ]);
        if (w) setWorkers(w);
        if (b) {
          if (prevBookingsCountRef.current > 0 && b.length > prevBookingsCountRef.current) {
            const newBooking = b[0];
            toast.info(`New Booking: ${(newBooking.service_categories as any)?.name || "Service"} from ${(newBooking.customer_id as any)?.full_name || "Customer"}`, {
              description: "A new service request has been received.",
              duration: 5000,
            });
          }
          setBookings(b);
          prevBookingsCountRef.current = b.length;
        }
        if (s) setServices(s);
        if (t) setTickets(t);
        if (!isBackground) setLoading(false);
      } catch (error) {
        console.error("Failed to load admin data", error);
        if (!isBackground) {
          toast.error("Failed to load dashboard data");
          setLoading(false);
        }
      }
    };

    load(false);
    const interval = setInterval(() => load(true), 15000); 
    return () => clearInterval(interval);
  }, [roles, navigate]);

  useEffect(() => {
    if ((activeTab !== "ecommerce" && activeTab !== "orders") || !roles.includes("admin")) return;
    const loadShopData = async () => {
      try {
        const [prods, ords] = await Promise.all([
          api.get("/products"),
          api.get("/orders"),
        ]);
        setShopProducts(prods || []);
        setShopOrders(ords || []);
      } catch (e) {
        console.error(e);
        toast.error("Could not load shop data");
      }
    };
    loadShopData();
  }, [activeTab, roles]);

  const approveWorker = async (workerId: string, action: "approved" | "rejected") => {
    const updates: any = { status: action };
    if (action === "approved") {
      const count = workers.filter((w) => w.status === "approved").length;
      updates.worker_id_code = `ONG-WRK-${(count + 1).toString().padStart(4, "0")}`;
    }

    try {
      await api.put(`/workers/${workerId}`, updates);
      toast.success(`Worker ${action}`);
      const data = await api.get("/workers");
      if (data) setWorkers(data);
    } catch (error) {
      toast.error("Failed to update worker status");
    }
  };

  const handleUpdateWorkerSkills = async () => {
    if (!skillEditWorkerId) return;
    try {
      await api.put(`/workers/${skillEditWorkerId}`, { skills: workerSkillsToEdit });
      toast.success("Worker skills updated");
      setIsSkillDialogOpen(false);
      const data = await api.get("/workers");
      if (data) setWorkers(data);
    } catch (error) {
      toast.error("Failed to update skills");
    }
  };

  const toggleSkill = (skill: string) => {
    setWorkerSkillsToEdit(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const toggleWorkerStatus = async (workerId: string) => {
    try {
      await api.post(`/workers/${workerId}/toggle-status`, {});
      toast.success("Worker status updated");
      const data = await api.get("/workers");
      if (data) setWorkers(data);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const assignWorker = async (bookingId: string, workerId: string) => {
    try {
      await api.put(`/bookings/${bookingId}`, {
        worker_id: workerId,
        status: "accepted"
      });
      setIsAssignDialogOpen(false);
      toast.success("Worker assigned!");
      const b = await api.get("/bookings");
      if (b) {
        setBookings(b);
        prevBookingsCountRef.current = b.length;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to assign worker");
    }
  };

  const totalRevenue = bookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + (b.platform_fee || 0), 0);
  const pendingWorkers = workers.filter((w) => w.status === "pending");
  const openTickets = tickets.filter(t => t.status === "Open");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero p-6 pb-10 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="text-primary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer" onClick={() => setNotificationCount(0)}>
              <Bell className="w-5 h-5 text-primary-foreground" />
              {notificationCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse border border-white">
                  {notificationCount}
                </span>
              )}
            </div>
            <button onClick={async () => { await signOut(); navigate("/auth"); }} className="text-primary-foreground/70">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-display font-bold text-primary-foreground">Admin Dashboard</h1>
        <p className="text-primary-foreground/70 text-sm">Manage LocalFix platform</p>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-6 mb-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: "Total Workers", value: workers.length, color: "text-primary" },
            { icon: AlertCircle, label: "Open Issues", value: openTickets.length, color: "text-red-500" },
            { icon: Zap, label: "Service Types", value: SKILL_OPTIONS.length, color: "text-indigo-500" },
            { icon: ClipboardList, label: "Total Bookings", value: bookings.length, color: "text-amber-600" },
            { icon: IndianRupee, label: "Platform Rev", value: `₹${totalRevenue}`, color: "text-emerald-500" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4"
            >
              <stat.icon className={`w-5 h-5 mb-1 ${stat.color}`} />
              <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full glass-card mb-4 flex flex-wrap h-auto gap-1 py-2 px-1 justify-center">
            <TabsTrigger value="workers" className="text-[10px] px-2">Workers</TabsTrigger>
            <TabsTrigger value="bookings" className="text-[10px] px-2">Bookings</TabsTrigger>
            <TabsTrigger value="services" className="text-[10px] px-2">Services</TabsTrigger>
            <TabsTrigger value="tickets" className="text-[10px] px-2">Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="workers">
            {pendingWorkers.length > 0 && (
              <div className="mb-4">
                <h3 className="font-display font-semibold text-foreground mb-2 text-sm">Pending Approval</h3>
                <div className="space-y-2">
                  {pendingWorkers.map((w) => (
                    <div key={w.id || w._id} className="glass-card p-4 border-l-4 border-l-amber-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{(w.user_id as any)?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{(w.user_id as any)?.phone}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {w.skills?.map((s: string) => (
                              <span key={s} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => approveWorker(w.id || w._id, "approved")} className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></button>
                          <button onClick={() => approveWorker(w.id || w._id, "rejected")} className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"><XCircle className="w-4 h-4 text-red-600" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="font-display font-semibold text-foreground mb-2 text-sm">All Approved Workers</h3>
            <div className="space-y-2">
              {workers.filter(w => w.status === 'approved' || w.status === 'suspended').map((w) => (
                <div key={w.id || w._id} className="glass-card p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm flex items-center gap-2">
                        {(w.user_id as any)?.full_name || "Unknown"}
                        {w.status === 'suspended' && <ShieldAlert className="w-3 h-3 text-red-500" />}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{w.worker_id_code || "Active"}</p>
                    </div>
                    <div className="flex gap-1.5">
                       <Button size="sm" variant="outline" className="h-7 text-[9px]" onClick={() => { 
                         setSkillEditWorkerId(w.id || w._id);
                         setWorkerSkillsToEdit(w.skills || []);
                         setIsSkillDialogOpen(true);
                       }}>
                         Manage Skills
                       </Button>
                       <Button size="sm" variant={w.status === 'suspended' ? 'secondary' : 'destructive'} className="h-7 text-[9px]" onClick={() => toggleWorkerStatus(w.id || w._id)}>
                         {w.status === 'suspended' ? 'Unblock' : 'Block'}
                       </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                     {w.skills?.length > 0 ? w.skills.map((s: string) => (
                        <span key={s} className="text-[7px] font-black uppercase text-secondary-foreground bg-secondary/20 px-1.5 py-0.5 rounded">
                           {s}
                        </span>
                     )) : <span className="text-[7px] text-muted-foreground italic">No skills assigned</span>}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings">
             <div className="space-y-2">
                {bookings.map((b) => (
                   <div key={b.id || b._id} className="glass-card p-3 border-l-4 border-l-indigo-500">
                      <div className="flex justify-between items-start mb-2">
                         <div>
                            <h4 className="font-bold text-sm">{(b.service_id as any)?.name}</h4>
                            <p className="text-[10px] text-muted-foreground"># {b.id || b._id}</p>
                         </div>
                         <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${
                            b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            b.status === 'requested' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                         }`}>
                            {b.status}
                         </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
                         <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {b.address?.split(',')[0]}
                         </div>
                         <div className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" /> ₹{b.total_price}
                         </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-muted/50">
                         <p className="text-[9px] italic">Customer: {(b.customer_id as any)?.full_name}</p>
                         {b.status === 'requested' && (
                            <Button size="sm" className="h-7 text-[9px]" onClick={() => openAssignDialog(b)}>Manual Assign</Button>
                         )}
                      </div>
                   </div>
                ))}
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Skill Management Dialog */}
      <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
        <DialogContent className="max-w-[340px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>Verify & Manage Skills</DialogTitle>
            <DialogDescription>Select the services this worker is qualified to perform.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {SKILL_OPTIONS.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`p-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                  workerSkillsToEdit.includes(skill)
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {skill}
                {workerSkillsToEdit.includes(skill) && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button className="w-full h-12 rounded-xl btn-primary-gradient" onClick={handleUpdateWorkerSkills}>
              Update Worker Services
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-[340px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>Manually Assign Worker</DialogTitle>
            <DialogDescription>Assign this job to a certified professional nearby.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2 py-2">
             {workers.filter(w => w.status === 'approved' && w.is_online).map(w => (
                <div key={w._id} className="p-3 border rounded-xl flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => assignWorker(selectedBooking?._id, w._id)}>
                   <div>
                      <p className="text-xs font-bold">{(w.user_id as any)?.full_name}</p>
                      <p className="text-[8px] text-muted-foreground">{w.rating} ⭐ • {w.skills?.slice(0,2).join(', ')}</p>
                   </div>
                   <ArrowRight className="w-4 h-4 text-primary" />
                </div>
             ))}
             {workers.filter(w => w.status === 'approved' && w.is_online).length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4 italic">No online workers found at this moment.</p>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
