import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

function toImageUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = API_URL.replace(/\/api$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem } = useCart();

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="min-h-screen pb-28 bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/85 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <Link to="/shop" className="p-2 rounded-xl hover:bg-muted transition-all duration-300">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-display font-bold">Your cart</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <ShoppingBag className="w-14 h-14 mx-auto text-muted-foreground/35" />
            <p className="text-muted-foreground text-sm">Your cart is empty.</p>
            <Link
              to="/shop"
              className="inline-flex btn-shop-gradient px-6 py-3 rounded-xl text-sm font-semibold text-white"
            >
              Browse shop
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((line, idx) => {
              const maxQ = line.stock ?? 999999;
              return (
                <motion.li
                  key={line.productId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                  className="rounded-2xl p-[1px] bg-gradient-to-br from-violet-500/50 via-indigo-500/35 to-blue-500/50 shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-300"
                  style={{ borderRadius: "16px" }}
                >
                  <div className="rounded-[15px] bg-card/95 backdrop-blur-sm p-3 flex gap-3 h-full">
                  <div className="w-20 h-20 rounded-xl bg-muted/50 overflow-hidden flex-shrink-0 ring-1 ring-border/50">
                    {line.image ? (
                      <img
                        src={toImageUrl(line.image)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-2">{line.name}</p>
                    <p className="text-sm font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent mt-1">
                      ₹{line.price}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                        onClick={() =>
                          line.quantity <= 1
                            ? removeItem(line.productId)
                            : updateQuantity(line.productId, line.quantity - 1)
                        }
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{line.quantity}</span>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-40"
                        disabled={line.quantity >= maxQ}
                        onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="ml-auto p-2 text-destructive/80 hover:bg-destructive/10 rounded-lg transition-colors"
                        onClick={() => removeItem(line.productId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-[4.5rem] left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-lg mx-auto rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl p-4 shadow-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold">₹{subtotal.toFixed(0)}</span>
            </div>
            <Button
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:scale-[1.02] shadow-lg shadow-violet-500/25 transition-all duration-300"
              onClick={() => navigate("/shop/checkout")}
            >
              Checkout
            </Button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
