import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { BottomNav } from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Star,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const CATEGORIES = [
  { id: "", label: "All" },
  { id: "machines", label: "Machines" },
  { id: "tools", label: "Tools" },
  { id: "electrical", label: "Electrical" },
  { id: "plumbing", label: "Plumbing" },
  { id: "carpenter", label: "Carpenter" },
  { id: "cleaning", label: "Cleaning" },
  { id: "home_essentials", label: "Home essentials" },
] as const;

export interface ShopProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  rating: number;
  numReviews?: number;
}

function toImageUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = API_URL.replace(/\/api$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export default function Shop() {
  const { user, roles } = useAuth();
  const { itemCount, addToCart } = useCart();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [rateProduct, setRateProduct] = useState<ShopProduct | null>(null);
  const [rateStars, setRateStars] = useState(5);

  const prioritize = roles.includes("worker") ? "worker" : "customer";

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("prioritize", prioritize);
      if (category) qs.set("category", category);
      if (search.trim()) qs.set("search", search.trim());
      const list = await api.get(`/products?${qs.toString()}`);
      const arr = Array.isArray(list) ? list : [];
      setProducts(
        arr.map((p: ShopProduct & { id?: string }) => ({
          ...p,
          _id: p._id || p.id || "",
        })),
      );
    } catch (e) {
      console.error(e);
      toast.error("Could not load shop");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, prioritize]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 320);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const add = (p: ShopProduct) => {
    addToCart({
      _id: p._id,
      name: p.name,
      price: p.price,
      image: p.image,
      stock: p.stock,
    });
    toast.success("Added to cart");
  };

  const submitRating = async () => {
    if (!rateProduct || !user) return;
    try {
      await api.post(`/products/${rateProduct._id}/rate`, {
        rating: rateStars,
      });
      toast.success("Thanks for rating!");
      setRateProduct(null);
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save rating";
      toast.error(msg);
    }
  };

  const headerSubtitle = useMemo(
    () => "Tools & home essentials — delivered to your door.",
    [],
  );

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/85 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl hover:bg-muted transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold gradient-text truncate">
              Shop Tools & Essentials
            </h1>
            <p className="text-[10px] text-muted-foreground truncate">
              {headerSubtitle}
            </p>
          </div>
          <Link
            to="/shop/cart"
            className="relative p-2.5 rounded-xl bg-gradient-to-br from-violet-600/90 via-indigo-600/90 to-blue-600/90 text-white shadow-lg shadow-violet-500/25 hover:scale-105 transition-all duration-300 hover:shadow-violet-500/40"
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-[10px] font-bold text-amber-950 flex items-center justify-center border-2 border-card">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10 h-11 rounded-2xl border-border/80 bg-card/90 transition-all duration-300 focus:ring-2 focus:ring-violet-500/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id || "all"}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                category === c.id
                  ? "text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 shadow-md shadow-violet-500/25 scale-[1.02]"
                  : "bg-muted/80 text-foreground hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/40 bg-muted/40 h-64 animate-pulse"
                style={{ borderRadius: "16px" }}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">
            No products match your filters.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            {products.map((p, i) => (
              <motion.article
                key={p._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="group rounded-2xl border border-border/50 bg-card/90 overflow-hidden shadow-[0_8px_30px_-12px_rgba(88,64,180,0.25)] hover:shadow-[0_16px_40px_-8px_rgba(88,64,180,0.35)] hover:scale-[1.02] transition-all duration-300 ease-out"
                style={{ borderRadius: "16px" }}
              >
                <div className="aspect-square bg-muted/40 relative overflow-hidden">
                  {p.image ? (
                    <img
                      src={toImageUrl(p.image)}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package className="w-12 h-12 opacity-40" />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="font-display font-semibold text-sm text-foreground line-clamp-2 leading-snug">
                    {p.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                      ₹{p.price}
                    </span>
                    <button
                      type="button"
                      onClick={() => user && setRateProduct(p)}
                      className="flex items-center gap-0.5 text-amber-500 text-xs font-medium hover:opacity-80"
                      title="Rate product"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {p.rating?.toFixed(1) ?? "—"}
                    </button>
                  </div>
                  <Button
                    type="button"
                    disabled={!p.stock}
                    className="w-full h-9 text-xs font-semibold rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:opacity-95 hover:scale-[1.02] shadow-md shadow-violet-500/20 transition-all duration-300"
                    onClick={() => add(p)}
                  >
                    {p.stock ? "Add to Cart" : "Out of stock"}
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      <Dialog open={!!rateProduct} onOpenChange={(o) => !o && setRateProduct(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Rate this product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{rateProduct?.name}</p>
          <div className="flex gap-1 justify-center py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRateStars(n)}
                className="p-1"
              >
                <Star
                  className={`w-8 h-8 ${
                    n <= rateStars
                      ? "text-amber-400 fill-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateProduct(null)}>
              Cancel
            </Button>
            <Button onClick={submitRating} disabled={!user}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
