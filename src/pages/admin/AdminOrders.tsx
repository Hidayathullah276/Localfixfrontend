import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Phone,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AdminOrders() {
  const { roles } = useAuth();
  const { ecommerceEnabled, settingsLoading } = useSettings();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "delivered" | "cancelled">("active");

  useEffect(() => {
    if (!roles.includes("admin")) {
      navigate("/");
      return;
    }
    
    // Check ecommerce setting - hide if disabled
    if (!settingsLoading && ecommerceEnabled === false) {
      navigate("/admin");
      return;
    }

    loadOrders();
  }, [roles, navigate, ecommerceEnabled, settingsLoading]);

  const loadOrders = async () => {
    try {
      const data = await api.get("/orders");
      setOrders(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load orders", error);
      toast.error("Failed to load orders");
      setLoading(false);
    }
  };

  const patchOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/orders/${orderId}`, { status });
      toast.success("Order updated");
      loadOrders();
    } catch {
      toast.error("Could not update order");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    return ["pending", "confirmed", "shipped"].includes(o.status);
  });

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-hero p-6 pb-10 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-4">
          <Link to="/admin" className="text-primary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="p-2 bg-white/20 rounded-full">
            <ShoppingBag className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-display font-bold text-primary-foreground">Order Management</h1>
        <p className="text-primary-foreground/70 text-sm">Track and update customer orders</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6">
        {/* Filters */}
        <div className="glass-card mb-4 p-1.5 flex gap-1 justify-between">
          {([
            { id: "active", label: "Pending / active", icon: Clock },
            { id: "delivered", label: "Delivered", icon: CheckCircle2 },
            { id: "cancelled", label: "Cancelled", icon: XCircle },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-300 ${
                filter === t.id
                  ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No {filter} orders found.</p>
            </div>
          ) : (
            filteredOrders.map((o, idx) => (
              <motion.div
                key={o._id || o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-4 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded uppercase tracking-wider">
                        #{o._id.slice(-6)}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(o.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <h3 className="font-bold text-foreground">{(o.user_id as any)?.full_name || "Customer"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <p className="text-[11px] text-muted-foreground">{(o.user_id as any)?.phone || o.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-display font-bold text-foreground">₹{o.total_amount}</p>
                    <p className="text-[10px] text-muted-foreground">{o.items.length} items</p>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-3 border border-border/40">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Delivery Address</p>
                  <p className="text-xs text-foreground line-clamp-2">{o.address}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
                      <button
                        key={s}
                        onClick={() => patchOrderStatus(o._id || o.id, s)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize border transition-all ${
                          o.status === s
                            ? "bg-violet-600 border-violet-600 text-white"
                            : "bg-card border-border hover:border-violet-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
