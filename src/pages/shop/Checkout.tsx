import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user?.full_name) setCustomerName(user.full_name);
    if (user?.phone) setPhone(user.phone);
  }, [user?.full_name, user?.phone]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const placeOrder = async () => {
    if (!customerName.trim()) {
      toast.error("Enter your name");
      return;
    }
    if (!address.trim()) {
      toast.error("Enter delivery address");
      return;
    }
    if (!phone.trim()) {
      toast.error("Enter phone number");
      return;
    }
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/orders", {
        customer_name: customerName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        payment_method: "cod",
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
      });
      toast.success("Order placed!");
      clearCart();
      navigate("/shop/orders");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Checkout failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-28 bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/85 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <Link to="/shop/cart" className="p-2 rounded-xl hover:bg-muted transition-all duration-300">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-display font-bold">Checkout</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">
            Your cart is empty.{" "}
            <Link to="/shop" className="text-violet-600 font-medium">
              Go to shop
            </Link>
          </p>
        ) : (
          <>
            <div className="rounded-2xl border border-border/50 bg-card/90 p-4 space-y-3 shadow-sm" style={{ borderRadius: "16px" }}>
              <h2 className="font-display font-semibold text-sm">Order summary</h2>
              <ul className="space-y-2 text-sm">
                {items.map((i) => (
                  <li key={i.productId} className="flex justify-between gap-2">
                    <span className="text-muted-foreground line-clamp-1">
                      {i.name} × {i.quantity}
                    </span>
                    <span className="font-medium shrink-0">
                      ₹{(i.price * i.quantity).toFixed(0)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border/50 pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                  ₹{total.toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Payment: Cash on delivery</p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/90 p-4 space-y-4" style={{ borderRadius: "16px" }}>
              <h2 className="font-display font-semibold text-sm">Delivery details</h2>
              <div className="space-y-2">
                <Label htmlFor="cname">Full name</Label>
                <Input
                  id="cname"
                  placeholder="Name for delivery"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr">Address</Label>
                <Textarea
                  id="addr"
                  placeholder="Full delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="min-h-[100px] rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <Button
              className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:scale-[1.02] shadow-lg shadow-violet-500/30 transition-all duration-300"
              disabled={submitting}
              onClick={placeOrder}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2 inline" />
                  Placing order…
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
