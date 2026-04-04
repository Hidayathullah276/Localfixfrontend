import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface OrderDetailData {
  _id: string;
  customer_name?: string;
  items: { name: string; price: number; quantity: number }[];
  total_amount: number;
  status: string;
  address: string;
  phone: string;
  payment_method: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetailData | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/orders/${id}`)
      .then(setOrder)
      .catch(() => toast.error("Order not found"));
  }, [id]);

  if (!order) {
    return (
      <div className="min-h-screen pb-24 flex flex-col">
        <header className="border-b border-border/60 bg-card/85 px-4 py-3">
          <Link to="/shop/orders" className="text-sm text-violet-600 font-medium">← Back to orders</Link>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/85 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <Link to="/shop/orders" className="p-2 rounded-xl hover:bg-muted transition-all duration-300">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-display font-bold">Order detail</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="rounded-2xl border border-border/50 bg-card/90 p-4" style={{ borderRadius: "16px" }}>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
          </p>
          <span
            className={`inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              STATUS_STYLES[order.status] || "bg-muted"
            }`}
          >
            {order.status}
          </span>
          <ul className="mt-4 space-y-2 text-sm border-t border-border/50 pt-4">
            {order.items.map((it, idx) => (
              <li key={idx} className="flex justify-between">
                <span className="text-muted-foreground">
                  {it.name} × {it.quantity}
                </span>
                <span>₹{(it.price * it.quantity).toFixed(0)}</span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between font-bold mt-4 pt-3 border-t border-border/50">
            <span>Total</span>
            <span>₹{order.total_amount}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/90 p-4 text-sm space-y-1" style={{ borderRadius: "16px" }}>
          {order.customer_name ? (
            <p>
              <span className="text-muted-foreground">Name — </span>
              {order.customer_name}
            </p>
          ) : null}
          <p>
            <span className="text-muted-foreground">Address — </span>
            {order.address}
          </p>
          <p>
            <span className="text-muted-foreground">Phone — </span>
            {order.phone}
          </p>
          <p>
            <span className="text-muted-foreground">Payment — </span>
            {order.payment_method === "cod" ? "Cash on delivery" : order.payment_method}
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
