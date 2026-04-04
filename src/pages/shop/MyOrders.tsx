import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Package, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface OrderRow {
  _id: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  address?: string;
  phone?: string;
  payment_method?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function MyOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders/user")
      .then((data) => setOrders(data || []))
      .catch(() => toast.error("Could not load orders"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/85 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <Link to="/shop" className="p-2 rounded-xl hover:bg-muted transition-all duration-300">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-display font-bold">My orders</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-12">Loading…</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Package className="w-14 h-14 mx-auto text-muted-foreground/35" />
            <p className="text-muted-foreground text-sm">No orders yet.</p>
            <Link
              to="/shop"
              className="inline-flex btn-shop-gradient px-6 py-3 rounded-xl text-sm font-semibold text-white"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          orders.map((o) => (
            <Link
              key={o._id}
              to={`/shop/orders/${o._id}`}
              className="block rounded-2xl border border-border/50 bg-card/90 p-4 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300"
              style={{ borderRadius: "16px" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()}
                  </p>
                  <p className="font-semibold text-sm mt-1">
                    {o.items.length} item{o.items.length !== 1 ? "s" : ""} · ₹{o.total_amount}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
              <span
                className={`inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  STATUS_STYLES[o.status] || "bg-muted"
                }`}
              >
                {o.status}
              </span>
            </Link>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
