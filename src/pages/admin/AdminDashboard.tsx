import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Users, ClipboardList, Settings, BarChart3, CheckCircle2, XCircle,
  ArrowLeft, LogOut, Wrench, IndianRupee, TrendingUp, Clock, Plus, Edit, Trash2, 
  AlertCircle, MessageSquare, Filter, Search, Eye, CheckCircle, ArrowRight, Bell, Phone
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { socket } from "@/lib/socket";

export default function AdminDashboard() {
  const { user, roles, signOut } = useAuth();
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
  const prevBookingsCountRef = useRef(0);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    icon: "Wrench",
    base_price: 199,
    emergency_price: ""
  });
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeTab, setActiveTab] = useState("workers");

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
      // Reload workers quietly
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
      // Reload bookings quietly
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
    const interval = setInterval(() => load(true), 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [roles, navigate]);

  const approveWorker = async (workerId: string, action: "approved" | "rejected") => {
    // Generate worker ID code on approval
    const updates: any = { status: action };
    if (action === "approved") {
      const count = workers.filter((w) => w.status === "approved").length;
      updates.worker_id_code = `ONG-WRK-${(count + 1).toString().padStart(4, "0")}`;
      updates.is_online = true; // Auto-online on approval
    }

    try {
      await api.put(`/workers/${workerId}`, updates);
      toast.success(`Worker ${action}`);
      // Refresh
      const data = await api.get("/workers");
      if (data) setWorkers(data);
    } catch (error) {
      toast.error("Failed to update worker status");
    }
  };

  const handleSaveService = async () => {
    try {
      if (editingService) {
        await api.put(`/services/${editingService.id || editingService._id}`, serviceForm);
        toast.success("Service updated");
      } else {
        await api.post("/services", serviceForm);
        toast.success("Service created");
      }
      setIsServiceDialogOpen(false);
      // Refresh
      const data = await api.get("/services");
      setServices(data || []);
    } catch (error) {
      toast.error("Failed to save service");
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await api.delete(`/services/${serviceId}`);
      toast.success("Service deleted");
      const data = await api.get("/services");
      setServices(data || []);
    } catch (error) {
      toast.error("Failed to delete service");
    }
  };

  const openAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: "",
      description: "",
      icon: "Wrench",
      base_price: 199,
      emergency_price: ""
    });
    setIsServiceDialogOpen(true);
  };

  const openEditService = (service: any) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      icon: service.icon || "Wrench",
      base_price: service.base_price,
      emergency_price: service.emergency_price || ""
    });
    setIsServiceDialogOpen(true);
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

      // Refresh
      const b = await api.get("/bookings");
      if (b) {
        setBookings(b);
        prevBookingsCountRef.current = b.length;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to assign worker");
    }
  };

  const openAssignDialog = (booking: any) => {
    setSelectedBooking(booking);
    setIsAssignDialogOpen(true);
  };

  const pendingWorkers = workers.filter((w) => w.status === "pending");
  const openTickets = tickets.filter(t => t.status === "Open");
  const totalRevenue = bookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + (b.platform_fee || 0), 0);

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await api.put(`/support/ticket/${ticketId}/status`, { status });
      toast.success(`Ticket marked as ${status}`);
      // Refresh tickets
      const t = await api.get("/support/admin/tickets");
      if (t) setTickets(t);
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (error) {
      toast.error("Failed to update ticket status");
    }
  };

  const handleSendAdminMessage = async () => {
    if (!adminMessage.trim()) return;
    try {
      await api.post(`/support/ticket/${selectedTicket._id}/message`, { message: adminMessage });
      setAdminMessage("");
      toast.success("Message sent");
      // Refresh tickets to get new message
      const t = await api.get("/support/admin/tickets");
      if (t) {
        setTickets(t);
        const updated = t.find((tick: any) => tick._id === selectedTicket._id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.ticketId?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.userId?.full_name?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.bookingId?.toString().toLowerCase().includes(ticketSearch.toLowerCase());
    
    const matchesStatus = ticketFilterStatus === "all" || t.status === ticketFilterStatus;
    const matchesRole = ticketFilterRole === "all" || t.role === ticketFilterRole;

    return matchesSearch && matchesStatus && matchesRole;
  });

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
            { icon: ClipboardList, label: "Pending Jobs", value: bookings.filter(b => b.status === "requested").length, color: "text-orange-500" },
            { icon: IndianRupee, label: "Revenue", value: `₹${totalRevenue}`, color: "text-emerald-500" },
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

      {/* Tabs */}
      <div className="px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full glass-card mb-4">
            <TabsTrigger value="workers" className="flex-1 text-xs">Workers</TabsTrigger>
            <TabsTrigger value="bookings" className="flex-1 text-xs">Bookings</TabsTrigger>
            <TabsTrigger value="services" className="flex-1 text-xs">Services</TabsTrigger>
            <TabsTrigger value="tickets" className="flex-1 text-xs">Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="workers">
            {pendingWorkers.length > 0 && (
              <div className="mb-4">
                <h3 className="font-display font-semibold text-foreground mb-2 text-sm">Pending Approval</h3>
                <div className="space-y-2">
                  {pendingWorkers.map((w) => (
                    <div key={w.id} className="glass-card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{(w.profiles as any)?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{(w.profiles as any)?.phone}</p>
                          <div className="flex gap-1 mt-1">
                            {w.skills?.map((s: string) => (
                              <span key={s} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">{w.experience_years} years exp.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveWorker(w.id, "approved")}
                            className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-4 h-4 text-secondary" />
                          </button>
                          <button
                            onClick={() => approveWorker(w.id, "rejected")}
                            className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center"
                          >
                            <XCircle className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="font-display font-semibold text-foreground mb-2 text-sm">All Workers ({workers.length})</h3>
            <div className="space-y-2">
              {workers.map((w) => (
                <div key={w.id} onClick={() => setSelectedWorker(w)} className="glass-card p-3 flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors">
                  <div>
                    <p className="font-medium text-foreground text-sm">{(w.profiles as any)?.full_name || "Unknown"}</p>
                    <p className="text-[10px] text-muted-foreground">{w.worker_id_code || "Pending"}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${w.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    w.status === "pending" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                    {w.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id || b._id} className="glass-card p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="font-medium text-foreground text-sm">{(b.service_categories as any)?.name}</p>
                      <p className="text-xs text-muted-foreground">{(b.customer_id as any)?.full_name || "Unknown"} • {(b.customer_id as any)?.phone || "No phone"}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-primary block">₹{b.total_price}</span>
                      <p className="text-[10px] text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${b.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                      b.status === "cancelled" ? "bg-red-100 text-red-700" :
                        b.status === "requested" ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                      }`}>
                      {b.status.replace("_", " ").toUpperCase()}
                    </span>
                    {b.status === "requested" && (
                      <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => openAssignDialog(b)}>
                        Assign Worker
                      </Button>
                    )}
                    {b.worker_id && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground italic">
                          Assigned to: {(b.worker_id as any)?.worker_id_code || "Worker"}
                        </p>
                        {b.accepted_at && (
                          <p className="text-[9px] text-emerald-600 font-medium">
                            Confirmed: {new Date(b.accepted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {bookings.length === 0 && (
                <div className="glass-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">No bookings yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="services">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground text-sm">Service Categories</h3>
              <Button onClick={openAddService} size="sm" className="h-8 gap-1">
                <Plus className="w-3.5 h-3.5" /> Add New
              </Button>
            </div>
            <div className="space-y-3 pb-20">
              {services.map((s) => (
                <div key={s.id || s._id} className="glass-card p-4 group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Wrench className="w-4 h-4 text-primary" />
                        </div>
                        <h4 className="font-semibold text-foreground">{s.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{s.description}</p>

                      <div className="flex items-center gap-4 mt-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Base Price</p>
                          <p className="font-bold text-foreground">₹{s.base_price}</p>
                        </div>
                        {s.emergency_price && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider text-destructive">Emergency</p>
                            <p className="font-bold text-destructive font-mono">₹{s.emergency_price}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => openEditService(s)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => deleteService(s.id || s._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tickets">
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="glass-card p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by ID, Name or Booking..." 
                    className="pl-10 h-10 text-xs"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 h-9 rounded-lg border border-border bg-card text-[10px] px-2 outline-none"
                    value={ticketFilterStatus}
                    onChange={(e) => setTicketFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                  <select 
                    className="flex-1 h-9 rounded-lg border border-border bg-card text-[10px] px-2 outline-none"
                    value={ticketFilterRole}
                    onChange={(e) => setTicketFilterRole(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    <option value="customer">Customers</option>
                    <option value="worker">Workers</option>
                  </select>
                </div>
              </div>

              {/* Tickets List */}
              <div className="space-y-2">
                {filteredTickets.map((t) => (
                  <div key={t._id} className="glass-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary font-mono bg-primary/5 px-2 py-0.5 rounded">
                          #{t.ticketId}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          t.role === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {t.role.toUpperCase()}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === 'Open' ? 'bg-red-100 text-red-700' : 
                        t.status === 'In Progress' ? 'bg-orange-100 text-orange-700' : 
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {t.status.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">{t.topic}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mb-3">{t.description}</p>
                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                          {t.userId?.full_name?.charAt(0)}
                        </div>
                        <span className="text-[10px] font-medium text-foreground">{t.userId?.full_name}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-[10px] gap-1 hover:text-primary"
                        onClick={() => { setSelectedTicket(t); setIsTicketDialogOpen(true); }}
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredTickets.length === 0 && (
                  <div className="glass-card p-10 text-center">
                    <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No matching issues found</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Worker Detail Modal */}
      <Dialog open={!!selectedWorker} onOpenChange={(open) => !open && setSelectedWorker(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Worker Details</DialogTitle>
            <DialogDescription>
              ID: {selectedWorker?.worker_id_code || "Pending assignment"}
            </DialogDescription>
          </DialogHeader>
          {selectedWorker && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                  <p className="text-sm font-semibold">{(selectedWorker.profiles as any)?.full_name || "Unknown"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm font-semibold">{(selectedWorker.profiles as any)?.phone || "No phone"}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <p className="text-sm font-semibold">{(selectedWorker.profiles as any)?.email || "No email"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selectedWorker.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    selectedWorker.status === "pending" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                    {selectedWorker.status.toUpperCase()}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Skills</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedWorker.skills?.map((s: string) => (
                    <span key={s} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded">{s}</span>
                  ))}
                  {(!selectedWorker.skills || selectedWorker.skills.length === 0) && <span className="text-sm">None</span>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t pt-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="font-bold text-foreground">{selectedWorker.experience_years}y</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="font-bold text-amber-500">{selectedWorker.rating}★</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Jobs Done</p>
                  <p className="font-bold text-primary">{selectedWorker.jobs_completed}</p>
                </div>
              </div>

              <div className="pt-4 border-t flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-medium text-muted-foreground">Availability</span>
                  <span className={`text-[10px] font-bold ${selectedWorker.is_online ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    {selectedWorker.is_online ? '● ONLINE' : '○ OFFLINE'}
                  </span>
                </div>
                {selectedWorker.status !== 'pending' && (
                  <Button
                    variant={selectedWorker.status === 'suspended' ? "secondary" : "destructive"}
                    className="w-full h-9 text-xs"
                    onClick={() => {
                      toggleWorkerStatus(selectedWorker.id || selectedWorker._id);
                      setSelectedWorker(null);
                    }}
                  >
                    {selectedWorker.status === 'suspended' ? 'Unblock Worker' : 'Block Worker ID'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Service CRUD Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
            <DialogDescription>
              {editingService ? "Update the service category details." : "Create a new service category for customers."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                placeholder="e.g. Plumber"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the service..."
                className="h-20"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Base Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={serviceForm.base_price}
                  onChange={(e) => setServiceForm({ ...serviceForm, base_price: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency">Emergency Price (₹)</Label>
                <Input
                  id="emergency"
                  type="number"
                  placeholder="Optional"
                  value={serviceForm.emergency_price}
                  onChange={(e) => setServiceForm({ ...serviceForm, emergency_price: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon Name (Lucide)</Label>
              <Input
                id="icon"
                placeholder="Wrench, Zap, Sparkles..."
                value={serviceForm.icon}
                onChange={(e) => setServiceForm({ ...serviceForm, icon: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveService}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Assign Worker Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Worker</DialogTitle>
            <DialogDescription>
              Select an <strong>online</strong> worker to handle this {selectedBooking?.service_categories?.name} request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto pr-2">
            {workers.filter(w => w.status === 'approved' && w.is_online).length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No online workers available right now.</p>
            )}
            {workers.filter(w => w.status === 'approved' && w.is_online).map((w) => (
              <div
                key={w.id || w._id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => assignWorker(selectedBooking.id || selectedBooking._id, w.id || w._id)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{(w.profiles as any)?.full_name}</p>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tight">ID: {w.worker_id_code} • {w.experience_years}y EXP</p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-xs">Assign</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Management Dialog */}
      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent className="sm:max-w-[500px] gap-0 p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-primary font-mono text-sm">#{selectedTicket?.ticketId}</span>
                  <span>Issue Details</span>
                </DialogTitle>
                <DialogDescription>
                  Raised on {selectedTicket && new Date(selectedTicket.createdAt).toLocaleString()}
                </DialogDescription>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                selectedTicket?.status === 'Open' ? 'bg-red-100 text-red-700' : 
                selectedTicket?.status === 'In Progress' ? 'bg-orange-100 text-orange-700' : 
                'bg-emerald-100 text-emerald-700'
              }`}>
                {selectedTicket?.status.toUpperCase()}
              </span>
            </div>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">User Name</p>
                  <p className="text-sm font-semibold">{selectedTicket?.userId?.full_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">User Type</p>
                  <p className="text-sm font-semibold capitalize">{selectedTicket?.role}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{selectedTicket?.userId?.phone}</p>
                    <a 
                      href={`tel:${selectedTicket?.userId?.phone}`} 
                      className="p-1.5 bg-secondary/10 rounded-lg text-secondary hover:bg-secondary/20 transition-colors"
                      title="Call Now"
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Booking ID</p>
                  <p className="text-sm font-semibold font-mono">{selectedTicket?.bookingId || 'N/A'}</p>
                </div>
              </div>

              {/* Issue Content */}
              <div>
                <h3 className="font-bold text-sm mb-2">Category: {selectedTicket?.topic}</h3>
                <div className="bg-card border p-4 rounded-2xl">
                  <p className="text-sm text-foreground leading-relaxed">
                    {selectedTicket?.description}
                  </p>
                </div>
              </div>

              {/* Conversation */}
              <div>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Communication Channel
                </h3>
                <div className="space-y-3 mb-4">
                  {selectedTicket?.messages?.map((msg: any, i: number) => (
                    <div key={i} className={`flex flex-col ${msg.senderId === user._id ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                        msg.senderId === user._id 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-muted text-foreground rounded-tl-none'
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {(!selectedTicket?.messages || selectedTicket.messages.length === 0) && (
                    <p className="text-xs text-center text-muted-foreground italic py-4">No messages yet</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input 
                    placeholder="Type your response..." 
                    className="h-10 text-xs rounded-xl"
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendAdminMessage()}
                  />
                  <Button size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={handleSendAdminMessage}>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row gap-2 justify-end">
            {selectedTicket?.status === 'Open' && (
              <Button 
                variant="outline" 
                className="flex-1 text-xs h-10 border-orange-200 text-orange-600 hover:bg-orange-50"
                onClick={() => handleUpdateTicketStatus(selectedTicket._id, 'In Progress')}
              >
                Mark In Progress
              </Button>
            )}
            {selectedTicket?.status !== 'Resolved' && (
              <Button 
                className="flex-1 text-xs h-10 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleUpdateTicketStatus(selectedTicket._id, 'Resolved')}
              >
                Resolve Issue
              </Button>
            )}
            <a 
              href={`tel:${selectedTicket?.userId?.phone}`}
              className="flex-1"
            >
              <Button 
                variant="outline" 
                className="w-full text-xs h-10 gap-2 border-primary/20 text-primary hover:bg-primary/5"
              >
                <Phone className="w-4 h-4" />
                Call {selectedTicket?.role === 'customer' ? 'Customer' : 'Worker'}
              </Button>
            </a>
            <Button 
              variant="ghost" 
              className="px-4 h-10 text-xs text-muted-foreground"
              onClick={() => setIsTicketDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
