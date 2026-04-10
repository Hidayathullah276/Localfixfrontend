import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Edit, Trash2, Search, RefreshCw,
  Package, ImageIcon, Tag, Box, FileText, DollarSign,
  Save, ShoppingBag, CheckCircle2, Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { API_URL } from "@/lib/api";

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
  machines: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  tools: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
  electrical: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
  plumbing: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20",
  carpenter: "text-amber-700 bg-amber-50 dark:bg-amber-900/20",
  cleaning: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
  home_essentials: "text-violet-600 bg-violet-50 dark:bg-violet-900/20",
};

const emptyForm = {
  name: "",
  description: "",
  price: 99,
  category: "tools",
  stock: 10,
  image: "",
  is_active: true,
};

export default function AdminProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const toAbsoluteUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_URL.replace("/api", "")}${path}`;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/products");
      setProducts(data || []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingProduct(null);
    setForm({ ...emptyForm });
    setIsFormOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingProduct(p);
    setForm({
      name: p.name || "",
      description: p.description || "",
      price: p.price ?? 99,
      category: p.category || "tools",
      stock: p.stock ?? 10,
      image: p.image || "",
      is_active: p.is_active !== false,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.price || form.price < 0) { toast.error("Enter a valid price"); return; }
    setSaving(true);
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id || editingProduct.id}`, form);
        toast.success("Product updated successfully!");
      } else {
        await api.post("/products", form);
        toast.success("Product added to the shop!");
      }
      setIsFormOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/products/${deleteId}`);
      toast.success("Product deleted");
      setIsDeleteOpen(false);
      setDeleteId(null);
      await load();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const toggleActive = async (p: any) => {
    try {
      await api.put(`/products/${p._id || p.id}`, { is_active: !p.is_active });
      toast.success(p.is_active ? "Product hidden from shop" : "Product now visible in shop");
      await load();
    } catch {
      toast.error("Failed to update product");
    }
  };

  const filtered = products.filter((p) => {
    const ms = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const mc = filterCategory === "all" || p.category === filterCategory;
    return ms && mc;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <div className="gradient-hero p-6 pb-12 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/admin")} className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Button
            onClick={openAdd}
            size="sm"
            className="h-8 px-4 text-xs font-bold rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur transition-all"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
            <Package className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-primary-foreground">Manage Products</h1>
            <p className="text-primary-foreground/70 text-sm">{products.length} products in shop</p>
          </div>
        </div>
      </div>

      {/* ─── Search + Filter ─── */}
      <div className="px-4 -mt-6 mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="pl-9 h-10 text-xs rounded-xl glass-card border-0 shadow-md"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-10 px-3 text-xs rounded-xl border border-input bg-card shadow-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shadow-md" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* ─── Stats Bar ─── */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total", value: products.length, color: "text-violet-600" },
            { label: "Active", value: products.filter((p) => p.is_active).length, color: "text-emerald-600" },
            { label: "Out of Stock", value: products.filter((p) => !p.stock).length, color: "text-red-500" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-3 text-center">
              <p className={`font-display font-bold text-xl ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Product List ─── */}
      <div className="px-4 pb-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="font-display font-bold text-foreground mb-1">No products found</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first product to the shop</p>
            <Button onClick={openAdd} className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {filtered.map((p, idx) => {
                const catColor = CATEGORY_COLORS[p.category] || "text-gray-600 bg-gray-50";
                const catLabel = PRODUCT_CATEGORIES.find((c) => c.value === p.category)?.label || p.category;
                return (
                  <motion.div
                    key={p._id || p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`glass-card overflow-hidden border ${!p.is_active ? "opacity-60" : ""}`}
                    style={{ borderRadius: "16px", padding: 0 }}
                  >
                    <div className="flex items-stretch">
                      {/* Image */}
                      <div className="w-20 h-24 flex-shrink-0 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 flex items-center justify-center overflow-hidden rounded-l-2xl">
                        {p.image ? (
                          <img src={toAbsoluteUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-7 h-7 text-muted-foreground/30" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-3 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-foreground truncate">{p.name}</h4>
                            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${catColor}`}>
                              {catLabel}
                            </span>
                          </div>
                          <div className="font-display font-bold text-sm text-foreground whitespace-nowrap">
                            ₹{p.price}
                          </div>
                        </div>

                        {p.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2">{p.description}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              p.stock > 10 ? "bg-emerald-100 text-emerald-700" :
                              p.stock > 0 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {p.stock > 0 ? `${p.stock} pcs` : "Out of stock"}
                            </span>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={!!p.is_active}
                                onCheckedChange={() => toggleActive(p)}
                                className="scale-[0.7]"
                              />
                              <span className="text-[9px] text-muted-foreground">{p.is_active ? "Live" : "Hidden"}</span>
                            </div>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => openEdit(p)}
                              className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center hover:bg-indigo-500/20 transition-colors group"
                            >
                              <Edit className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={() => confirmDelete(p._id || p.id)}
                              className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors group"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600 group-hover:scale-110 transition-transform" />
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
      </div>

      {/* ═══ Add / Edit Product Dialog ═══ */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-[360px] rounded-[2rem] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {editingProduct
                ? <><Edit className="w-4 h-4 text-indigo-600" /> Edit Product</>
                : <><Plus className="w-4 h-4 text-violet-600" /> Add New Product</>
              }
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingProduct ? "Update the product details below." : "Fill in details for the new product."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-violet-600" /> Product Name *
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className="pl-6 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Box className="w-3 h-3 text-emerald-600" /> Stock Qty
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
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
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
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
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://example.com/product.jpg"
                className="rounded-xl text-sm"
              />
              {form.image && (
                <div className="w-full h-28 rounded-xl overflow-hidden bg-muted/30 mt-2 border border-border/50">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-blue-600" /> Description
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the product…"
                className="rounded-xl text-sm resize-none min-h-[80px]"
                rows={3}
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/30">
              <div>
                <p className="text-xs font-bold text-foreground">Visible to customers</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Show this product in the shop</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(val) => setForm((f) => ({ ...f, is_active: val }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl text-sm" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              {saving ? (
                <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-3.5 h-3.5 mr-1.5" /> {editingProduct ? "Update Product" : "Add Product"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirmation Dialog ═══ */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-[310px] rounded-[2rem]">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-red-600">Delete Product?</DialogTitle>
            <DialogDescription className="text-center text-sm">
              This action is permanent and cannot be undone. The product will be removed from your shop.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="flex-1 rounded-xl font-bold">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
