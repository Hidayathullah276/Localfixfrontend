import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useSettings } from "@/contexts/SettingsContext";

/** Matches requested localStorage shape */
export type LocalCartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  stock?: number;
};

const CART_STORAGE_KEY = "cart";

function readRawCart(): LocalCartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .map((row: Record<string, unknown>) => ({
        productId: String(row.productId ?? row.product_id ?? ""),
        name: String(row.name ?? ""),
        price: Number(row.price),
        quantity: Math.max(1, parseInt(String(row.quantity), 10) || 1),
        image: row.image != null ? String(row.image) : undefined,
        stock: row.stock != null ? Number(row.stock) : undefined,
      }))
      .filter((i) => i.productId && i.name && Number.isFinite(i.price));
  } catch {
    return [];
  }
}

function writeRawCart(items: LocalCartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota / private mode */
  }
}

export type CartContextType = {
  items: LocalCartItem[];
  itemCount: number;
  addToCart: (product: {
    _id: string;
    name: string;
    price: number;
    image?: string;
    stock: number;
  }) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  refreshCart: () => void;
};

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  addToCart: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  refreshCart: () => {},
});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: ReactNode }) {
  const { ecommerceEnabled } = useSettings();
  const [items, setItems] = useState<LocalCartItem[]>([]);

  const refreshCart = useCallback(() => {
    setItems(readRawCart());
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    if (ecommerceEnabled === false) {
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setItems([]);
    }
  }, [ecommerceEnabled]);

  const addToCart = useCallback(
    (product: {
      _id: string;
      name: string;
      price: number;
      image?: string;
      stock: number;
    }) => {
      if (ecommerceEnabled === false) return;
      const list = readRawCart();
      const idx = list.findIndex((i) => i.productId === product._id);
      const maxStock = Math.max(0, product.stock);
      if (idx >= 0) {
        const nextQty = list[idx].quantity + 1;
        if (maxStock > 0 && nextQty > maxStock) return;
        list[idx] = {
          ...list[idx],
          quantity: nextQty,
          stock: maxStock,
        };
      } else {
        if (maxStock <= 0) return;
        list.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
          stock: maxStock,
        });
      }
      writeRawCart(list);
      setItems([...list]);
    },
    [ecommerceEnabled],
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const list = readRawCart();
    const idx = list.findIndex((i) => i.productId === productId);
    if (idx < 0) return;
    const max = list[idx].stock ?? Infinity;
    if (quantity < 1) {
      list.splice(idx, 1);
      writeRawCart(list);
      setItems([...list]);
      return;
    }
    const q = Math.min(quantity, max);
    list[idx] = { ...list[idx], quantity: q };
    writeRawCart(list);
    setItems([...list]);
  }, []);

  const removeItem = useCallback((productId: string) => {
    const list = readRawCart().filter((i) => i.productId !== productId);
    writeRawCart(list);
    setItems([...list]);
  }, []);

  const clearCart = useCallback(() => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
    }),
    [items, itemCount, addToCart, updateQuantity, removeItem, clearCart, refreshCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
