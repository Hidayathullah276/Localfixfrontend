import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ClipboardList, Settings, CheckCircle2, XCircle,
  ArrowLeft, LogOut, IndianRupee, Plus, Edit, Trash2,
  AlertCircle, Search, ArrowRight, Bell, ShoppingBag, Zap,
  MapPin, ShieldAlert, ToggleLeft, ToggleRight, Package,
  ImageIcon, Tag, Box, FileText, DollarSign, Save, RefreshCw,
  Store, SlidersHorizontal, ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { socket } from "@/lib/socket";
import { API_URL } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";

const SKILL_OPTIONS = ["Plumber", "Electrician", "Bathroom Cleaning", "House Cleaning", "Home Shifting", "AC Repair", "Carpenter"];
const PRODUCT_CATEGORIES = [
  { value: "machines", label: "Machines" },
  { value: "tools", label: "Tools" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "carpenter", label: "Carpenter" },
  { value: "cleaning", label: "Cleaning" },
  { value: "home_essentials", label: "Home Essentials" },
];

const CATEGORY_COLORS: Record<string, string> = {
  machines: "text-blue-600 bg-blue-50",
  tools: "text-orange-600 bg-orange-50",
  electrical: "text-yellow-600 bg-yellow-50",
  plumbing: "text-cyan-600 bg-cyan-50",
  carpenter: "text-amber-700 bg-amber-50",
  cleaning: "text-emerald-600 bg-emerald-50",
  home_essentials: "text-violet-600 bg-violet-50",
};

const emptyProductForm = {
  name: "",
  description: "",
  price: 99,
  category: "tools",
  stock: 10,
  image: "",
  is_active: true,
};

export default function AdminDashboard() {
  const { user, roles, signOut } = useAuth();
  const { ecommerceEnabled, refreshSettings, settingsLoading, inspectionFee: currentInspectionFee, hourlyPlatformFee: currentHourlyFee } = useSettings();
  const navigate = useNavigate();

  // ── Core data ──────────────────────────────────────────────
  const [workers, setWorkers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const prevBookingsCountRef = useRef(0);

  // ── UI state ────────────────────────────────────────────────
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeTab, setActiveTab] = useState("workers");

  // ── Worker management ──────────────────────────────────────
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [workerSkillsToEdit, setWorkerSkillsToEdit] = useState<string[]>([]);
  const [skillEditWorkerId, setSkillEditWorkerId] = useState<string | null>(null);

  // ── Settings ────────────────────────────────────────────────
  const [savingSettings, setSavingSettings] = useState(false);
  const [shopToggle, setShopToggle] = useState<boolean>(false);
  const [tempFees, setTempFees] = useState({ inspection: 50, hourly: 20 });

  useEffect(() => {
    if (ecommerceEnabled !== null) setShopToggle(!!ecommerceEnabled);
    setTempFees({ inspection: currentInspectionFee, hourly: currentHourlyFee });
  }, [ecommerceEnabled, currentInspectionFee, currentHourlyFee]);

  // ── Products ────────────────────────────────────────────────
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productFilterCategory, setProductFilterCategory] = useState("all");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState({ ...emptyProductForm });
  const [productSaving, setProductSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // ── Shop orders ─────────────────────────────────────────────
  const [shopOrders, setShopOrders] = useState<any[]>([]);

  const toAbsoluteUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_URL.replace("/api", "")}${path}`;
  };

  // ── Socket listeners ────────────────────────────────────────
  useEffect(() => {
    socket.on("new_worker_application", () => {
      setNotificationCount((p) => p + 1);
      toast.info("New worker application received!", { description: "Check the Workers tab." });
      api.get("/workers").then((w) => w && setWorkers(w)).catch(() => {});
    });
    socket.on("new_booking_created", () => {
      setNotificationCount((p) => p + 1);
      toast.info("New booking request!", { description: "Check the Bookings tab." });
      api.get("/bookings").then((b) => b && setBookings(b)).catch(() => {});
    });
    return () => {
      socket.off("new_worker_application");
      socket.off("new_booking_created");
    };
  }, []);

  // ── Initial data load ───────────────────────────────────────
  useEffect(() => {
    if (!roles.includes("admin")) { navigate("/"); return; }
    const load = async (bg = false) => {
      try {
        const [w, b, t] = await Promise.all([
          api.get("/workers"),
          api.get("/bookings"),
          api.get("/support/admin/tickets"),
        ]);
        if (w) setWorkers(w);
        if (b) {
          if (prevBookingsCountRef.current > 0 && b.length > prevBookingsCountRef.current) {
            toast.info("New booking request arrived!");
          }
          setBookings(b);
          prevBookingsCountRef.current = b.length;
        }
        if (t) setTickets(t);
        if (!bg) setLoading(false);
      } catch {
        if (!bg) { toast.error("Failed to load dashboard data"); setLoading(false); }
      }
    };
    load();
    const iv = setInterval(() => load(true), 15000);
    return () => clearInterval(iv);
  }, [roles, navigate]);

  // ── Load products when tab is active ───────────────────────
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const [prods, ords] = await Promise.all([api.get("/products"), api.get("/orders")]);
      setShopProducts(prods || []);
      setShopOrders(ords || []);
    } catch {
      toast.error("Could not load shop data");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if ((activeTab === "products" || activeTab === "shoporders") && roles.includes("admin")) {
      loadProducts();
    }
  }, [activeTab, roles]);

  // ── Worker helpers ──────────────────────────────────────────
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
    } catch {
      toast.error("Failed to update worker status");
    }
  };

  const toggleWorkerStatus = async (workerId: string) => {
    try {
      await api.post(`/workers/${workerId}/toggle-status`, {});
      toast.success("Worker status updated");
      const data = await api.get("/workers");
      if (data) setWorkers(data);
    } catch {
      toast.error("Failed to update status");
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
    } catch {
      toast.error("Failed to update skills");
    }
  };

  const toggleSkill = (skill: string) =>
    setWorkerSkillsToEdit((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);

  const openAssignDialog = (booking: any) => {
    setSelectedBooking(booking);
    setIsAssignDialogOpen(true);
  };

  const assignWorker = async (bookingId: string, workerId: string) => {
    try {
      await api.put(`/bookings/${bookingId}`, { worker_id: workerId, status: "accepted" });
      setIsAssignDialogOpen(false);
      toast.success("Worker assigned!");
      const b = await api.get("/bookings");
      if (b) { setBookings(b); prevBookingsCountRef.current = b.length; }
    } catch (err: any) {
      toast.error(err.message || "Failed to assign worker");
    }
  };

  // ── Settings helpers ────────────────────────────────────────
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put("/settings", {
        shopEnabled: shopToggle,
        ecommerce_enabled: shopToggle,
        inspection_fee: tempFees.inspection,
        hourly_platform_fee: tempFees.hourly,
        platformFee: tempFees.hourly,
      });
      await refreshSettings();
      toast.success("Settings saved!", { description: "Platform settings updated successfully." });
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleQuickShopToggle = async (val: boolean) => {
    setShopToggle(val);
    try {
      await api.put("/settings/ecommerce-toggle", { ecommerce_enabled: val });
      await refreshSettings();
      toast.success(val ? "Shop is now LIVE 🛍️" : "Shop is now hidden", {
        description: val ? "Customers can browse and buy products." : "Shop section hidden from all users.",
      });
    } catch {
      setShopToggle(!val);
      toast.error("Toggle failed");
    }
  };

  // ── Product helpers ─────────────────────────────────────────
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ ...emptyProductForm });
    setIsProductDialogOpen(true);
  };

  const openEditProduct = (p: any) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name || "",
      description: p.description || "",
      price: p.price ?? 99,
      category: p.category || "tools",
      stock: p.stock ?? 10,
      image: p.image || "",
      is_active: p.is_active !== false,
    });
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) { toast.error("Product name is required"); return; }
    if (!productForm.price || productForm.price < 0) { toast.error("Enter a valid price"); return; }
    setProductSaving(true);
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id || editingProduct.id}`, productForm);
        toast.success("Product updated!");
      } else {
        await api.post("/products", productForm);
        toast.success("Product added!");
      }
      setIsProductDialogOpen(false);
      await loadProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setProductSaving(false);
    }
  };

  const openDeleteConfirm = (id: string) => {
    setDeleteConfirmId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/products/${deleteConfirmId}`);
      toast.success("Product deleted");
      setIsDeleteDialogOpen(false);
      setDeleteConfirmId(null);
      await loadProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const toggleProductActive = async (p: any) => {
    try {
      await api.put(`/products/${p._id || p.id}`, { is_active: !p.is_active });
      toast.success(p.is_active ? "Product hidden" : "Product visible");
      await loadProducts();
    } catch {
      toast.error("Failed to update product");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading Admin Dashboard…</p>
        </div>
      </div>
    );
  }

  const totalRevenue = bookings.filter((b) => b.status === "completed").reduce((s, b) => s + (b.platform_fee || 0), 0);
  const pendingWorkers = workers.filter((w) => w.status === "pending");
  const openTickets = tickets.filter((t) => t.status === "Open");

  const filteredProducts = shopProducts.filter((p) => {
    const matchSearch = !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase());
    const matchCat = productFilterCategory === "all" || p.category === productFilterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ──────────────────────────────── */}
      <div className="gradient-hero p-6 pb-10 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
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
            <button onClick={async () => { await signOut(); navigate("/auth"); }} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-display font-bold text-primary-foreground">Admin Dashboard</h1>
        <p className="text-primary-foreground/70 text-sm">Manage the LocalFix platform</p>
      </div>

      {/* ─── Stats ───────────────────────────────── */}
      <div className="px-4 -mt-6 mb-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Users, label: "Workers", value: workers.length, color: "text-primary" },
            { icon: ClipboardList, label: "Bookings", value: bookings.length, color: "text-amber-600" },
            { icon: AlertCircle, label: "Open Issues", value: openTickets.length, color: "text-red-500" },
            { icon: Package, label: "Products", value: shopProducts.length, color: "text-violet-600" },
            { icon: ShoppingCart, label: "Orders", value: shopOrders.length, color: "text-blue-600" },
            { icon: IndianRupee, label: "Revenue", value: `₹${totalRevenue}`, color: "text-emerald-500" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-3"
            >
              <stat.icon className={`w-4 h-4 mb-1 ${stat.color}`} />
              <p className="text-base font-display font-bold text-foreground leading-tight">{stat.value}</p>
              <p className="text-[9px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Tabs ────────────────────────────────── */}
      <div className="px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full glass-card mb-4 flex flex-wrap h-auto gap-1 py-2 px-1 justify-center">
            <TabsTrigger value="workers" className="text-[10px] px-2 flex items-center gap-1">
              <Users className="w-3 h-3" /> Workers
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-[10px] px-2 flex items-center gap-1">
              <ClipboardList className="w-3 h-3" /> Bookings
            </TabsTrigger>
            <TabsTrigger value="products" className="text-[10px] px-2 flex items-center gap-1">
              <Package className="w-3 h-3" /> Products
            </TabsTrigger>
            <TabsTrigger value="shoporders" className="text-[10px] px-2 flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> Shop Orders
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-[10px] px-2 flex items-center gap-1">
              <Settings className="w-3 h-3" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* ═══ WORKERS TAB ═══════════════════════════════════ */}
          <TabsContent value="workers">
            {pendingWorkers.length > 0 && (
              <div className="mb-4">
                <h3 className="font-display font-semibold text-foreground mb-2 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Pending Approval ({pendingWorkers.length})
                </h3>
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
                          <button onClick={() => approveWorker(w.id || w._id, "approved")} className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </button>
                          <button onClick={() => approveWorker(w.id || w._id, "rejected")} className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                            <XCircle className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="font-display font-semibold text-foreground mb-2 text-sm">All Approved Workers</h3>
            <div className="space-y-2">
              {workers.filter((w) => w.status === "approved" || w.status === "suspended").map((w) => (
                <div key={w.id || w._id} className="glass-card p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm flex items-center gap-2">
                        {(w.user_id as any)?.full_name || "Unknown"}
                        {w.status === "suspended" && <ShieldAlert className="w-3 h-3 text-red-500" />}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{w.worker_id_code || "Active"}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 text-[9px]" onClick={() => {
                        setSkillEditWorkerId(w.id || w._id);
                        setWorkerSkillsToEdit(w.skills || []);
                        setIsSkillDialogOpen(true);
                      }}>
                        Skills
                      </Button>
                      <Button size="sm" variant={w.status === "suspended" ? "secondary" : "destructive"} className="h-7 text-[9px]" onClick={() => toggleWorkerStatus(w.id || w._id)}>
                        {w.status === "suspended" ? "Unblock" : "Block"}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {w.skills?.length > 0 ? w.skills.map((s: string) => (
                      <span key={s} className="text-[7px] font-black uppercase text-secondary-foreground bg-secondary/20 px-1.5 py-0.5 rounded">{s}</span>
                    )) : <span className="text-[7px] text-muted-foreground italic">No skills assigned</span>}
                  </div>
                </div>
              ))}
              {workers.filter((w) => w.status === "approved" || w.status === "suspended").length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8 italic">No approved workers yet.</p>
              )}
            </div>
          </TabsContent>

          {/* ═══ BOOKINGS TAB ══════════════════════════════════ */}
          <TabsContent value="bookings">
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id || b._id} className="glass-card p-3 border-l-4 border-l-indigo-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-sm">{(b.service_id as any)?.name || "Service"}</h4>
                      <p className="text-[10px] text-muted-foreground"># {b.id || b._id}</p>
                    </div>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${
                      b.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                      b.status === "requested" ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.address?.split(",")[0]}</div>
                    <div className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> ₹{b.total_price}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-muted/50">
                    <p className="text-[9px] italic">Customer: {(b.customer_id as any)?.full_name}</p>
                    {b.status === "requested" && (
                      <Button size="sm" className="h-7 text-[9px]" onClick={() => openAssignDialog(b)}>Manual Assign</Button>
                    )}
                  </div>
                </div>
              ))}
              {bookings.length === 0 && <p className="text-center text-xs text-muted-foreground py-8 italic">No bookings yet.</p>}
            </div>
          </TabsContent>

          {/* ═══ PRODUCTS TAB ══════════════════════════════════ */}
          <TabsContent value="products">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-lg text-foreground">Product Management</h2>
                <p className="text-xs text-muted-foreground">{shopProducts.length} products total</p>
              </div>
              <Button
                onClick={openAddProduct}
                className="h-9 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-violet-500/25 transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
              </Button>
            </div>

            {/* Search + filter */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products…"
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>
              <select
                value={productFilterCategory}
                onChange={(e) => setProductFilterCategory(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Categories</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={loadProducts} disabled={productsLoading}>
                <RefreshCw className={`w-3.5 h-3.5 ${productsLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Products grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 gap-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No products found</p>
                <Button onClick={openAddProduct} variant="outline" className="mt-3 text-xs rounded-xl">
                  <Plus className="w-3 h-3 mr-1" /> Add your first product
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence>
                  {filteredProducts.map((p, idx) => {
                    const catColor = CATEGORY_COLORS[p.category] || "text-gray-600 bg-gray-50";
                    const catLabel = PRODUCT_CATEGORIES.find((c) => c.value === p.category)?.label || p.category;
                    return (
                      <motion.div
                        key={p._id || p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`glass-card p-0 overflow-hidden border ${!p.is_active ? "opacity-60" : ""}`}
                        style={{ borderRadius: "16px" }}
                      >
                        <div className="flex items-stretch gap-0">
                          {/* Image */}
                          <div className="w-20 h-24 flex-shrink-0 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 flex items-center justify-center rounded-l-2xl overflow-hidden">
                            {p.image ? (
                              <img src={toAbsoluteUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 p-3 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-foreground truncate">{p.name}</h4>
                                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md ${catColor}`}>
                                  {catLabel}
                                </span>
                              </div>
                              <div className="font-display font-bold text-sm text-foreground whitespace-nowrap">₹{p.price}</div>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2">{p.description || "—"}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  p.stock > 10 ? "bg-emerald-100 text-emerald-700" :
                                  p.stock > 0 ? "bg-amber-100 text-amber-700" :
                                  "bg-red-100 text-red-700"
                                }`}>
                                  {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                                </span>
                                <Switch
                                  checked={!!p.is_active}
                                  onCheckedChange={() => toggleProductActive(p)}
                                  className="scale-75"
                                />
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => openEditProduct(p)}
                                  className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center hover:bg-indigo-500/20 transition-colors"
                                >
                                  <Edit className="w-3.5 h-3.5 text-indigo-600" />
                                </button>
                                <button
                                  onClick={() => openDeleteConfirm(p._id || p.id)}
                                  className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* ═══ SHOP ORDERS TAB ═══════════════════════════════ */}
          <TabsContent value="shoporders">
            <h2 className="font-display font-bold text-lg text-foreground mb-4">Shop Orders</h2>
            {shopOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No shop orders yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shopOrders.map((o: any) => (
                  <div key={o._id} className="glass-card p-3 border-l-4 border-l-violet-500">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-xs text-foreground"># {o._id?.slice(-8)}</p>
                        <p className="text-[10px] text-muted-foreground">{(o.customer_id as any)?.full_name || "Customer"}</p>
                      </div>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${
                        o.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                        o.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{o.items?.length || 0} items</span>
                      <span className="font-bold text-foreground">₹{o.total_amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══ SETTINGS TAB ══════════════════════════════════ */}
          <TabsContent value="settings">
            <div className="space-y-5">
              {/* Shop Toggle Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 border-l-4 border-l-violet-500"
                style={{ borderRadius: "20px" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-foreground">Shop Section</h3>
                    <p className="text-[11px] text-muted-foreground">Control e-commerce visibility</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl mb-3">
                  <div>
                    <p className="font-semibold text-sm text-foreground">Enable Shop Section</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {shopToggle
                        ? "🟢 Shop is visible to all customers"
                        : "🔴 Shop is hidden from frontend"}
                    </p>
                  </div>
                  <Switch
                    id="shop-toggle"
                    checked={shopToggle}
                    onCheckedChange={handleQuickShopToggle}
                    disabled={settingsLoading}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-indigo-600"
                  />
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-xl text-sm ${shopToggle ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
                  {shopToggle ? <ToggleRight className="w-4 h-4 flex-shrink-0" /> : <ToggleLeft className="w-4 h-4 flex-shrink-0" />}
                  <span className="text-[11px] font-medium">
                    {shopToggle
                      ? "Shop links appear in navbar. Product pages and cart are accessible."
                      : "Shop link removed from navbar. All shop routes redirect to home."}
                  </span>
                </div>
              </motion.div>

              {/* Platform Fees Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="glass-card p-5 border-l-4 border-l-amber-500"
                style={{ borderRadius: "20px" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <SlidersHorizontal className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-foreground">Platform Fees</h3>
                    <p className="text-[11px] text-muted-foreground">Applied dynamically to all bookings</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                      Inspection Fee (₹)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">₹</span>
                      <Input
                        type="number"
                        min={0}
                        value={tempFees.inspection}
                        onChange={(e) => setTempFees((p) => ({ ...p, inspection: Number(e.target.value) }))}
                        className="pl-7 h-11 rounded-xl text-sm font-semibold"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Charged per booking for site inspection</p>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-600" />
                      Platform Commission Fee (₹/hr)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">₹</span>
                      <Input
                        type="number"
                        min={0}
                        value={tempFees.hourly}
                        onChange={(e) => setTempFees((p) => ({ ...p, hourly: Number(e.target.value) }))}
                        className="pl-7 h-11 rounded-xl text-sm font-semibold"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Added to every booking's total. Currently: ₹{currentHourlyFee}/hr</p>
                  </div>
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Button
                  className="w-full h-13 py-3.5 text-sm font-bold rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-violet-500/30 transition-all duration-300 hover:scale-[1.01]"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                >
                  {savingSettings ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Save All Settings</>
                  )}
                </Button>

                <p className="text-center text-[10px] text-muted-foreground mt-2">
                  Changes take effect immediately for all users
                </p>
              </motion.div>

              {/* Current Status Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card p-4"
                style={{ borderRadius: "16px" }}
              >
                <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-primary" />
                  Current Platform Configuration
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Shop Status", value: ecommerceEnabled ? "Enabled ✅" : "Disabled ❌", color: ecommerceEnabled ? "text-emerald-600" : "text-red-500" },
                    { label: "Products", value: `${shopProducts.length} total`, color: "text-violet-600" },
                    { label: "Inspection Fee", value: `₹${currentInspectionFee}`, color: "text-amber-600" },
                    { label: "Platform Fee", value: `₹${currentHourlyFee}/hr`, color: "text-indigo-600" },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted/30 rounded-xl p-2.5">
                      <p className="text-[9px] text-muted-foreground mb-0.5">{item.label}</p>
                      <p className={`text-xs font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══ DIALOGS ═══════════════════════════════════════════ */}

      {/* Skill management dialog */}
      <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
        <DialogContent className="max-w-[340px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>Manage Worker Skills</DialogTitle>
            <DialogDescription>Select the services this worker can perform.</DialogDescription>
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

      {/* Manual assign booking dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-[340px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>Manually Assign Worker</DialogTitle>
            <DialogDescription>Assign this job to a certified professional nearby.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2 py-2">
            {workers.filter((w) => w.status === "approved" && w.is_online).map((w) => (
              <div
                key={w._id}
                className="p-3 border rounded-xl flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => assignWorker(selectedBooking?._id, w._id)}
              >
                <div>
                  <p className="text-xs font-bold">{(w.user_id as any)?.full_name}</p>
                  <p className="text-[8px] text-muted-foreground">{w.rating} ⭐ • {w.skills?.slice(0, 2).join(", ")}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            ))}
            {workers.filter((w) => w.status === "approved" && w.is_online).length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4 italic">No online workers found at this moment.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Product dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-[360px] rounded-[2rem] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingProduct ? <><Edit className="w-4 h-4 text-indigo-600" /> Edit Product</> : <><Plus className="w-4 h-4 text-violet-600" /> Add New Product</>}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update product details below." : "Fill in details for the new product."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-violet-600" /> Product Name *
              </Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Professional Drill Machine"
                className="rounded-xl text-sm"
              />
            </div>

            {/* Price + Stock */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3 text-amber-600" /> Price (₹) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">₹</span>
                  <Input
                    type="number"
                    min={0}
                    value={productForm.price}
                    onChange={(e) => setProductForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    className="pl-6 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Box className="w-3 h-3 text-emerald-600" /> Stock
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={productForm.stock}
                  onChange={(e) => setProductForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <ShoppingBag className="w-3 h-3 text-indigo-600" /> Category *
              </Label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full h-10 px-3 text-sm rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3 text-pink-600" /> Image URL
              </Label>
              <Input
                value={productForm.image}
                onChange={(e) => setProductForm((p) => ({ ...p, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="rounded-xl text-sm"
              />
              {productForm.image && (
                <div className="w-full h-24 rounded-xl overflow-hidden bg-muted/50 mt-2">
                  <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-blue-600" /> Description
              </Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief product description…"
                className="rounded-xl text-sm resize-none"
                rows={3}
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <p className="text-xs font-bold text-foreground">Visible to customers</p>
                <p className="text-[10px] text-muted-foreground">Show this product in the shop</p>
              </div>
              <Switch
                checked={productForm.is_active}
                onCheckedChange={(val) => setProductForm((p) => ({ ...p, is_active: val }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={productSaving}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold"
            >
              {productSaving ? (
                <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-3.5 h-3.5 mr-1.5" /> {editingProduct ? "Update" : "Add Product"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[320px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" /> Delete Product
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              className="flex-1 rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
