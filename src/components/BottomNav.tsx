import { Home, Search, ShoppingBag, ClipboardList, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";

const navItemsAll = [
  { icon: Home, label: "Home", path: "/", match: (p: string) => p === "/" },
  { icon: Search, label: "Services", path: "/services", match: (p: string) => p === "/services" },
  { icon: ShoppingBag, label: "Shop", path: "/shop", match: (p: string) => p.startsWith("/shop") },
  { icon: ClipboardList, label: "Bookings", path: "/bookings", match: (p: string) => p === "/bookings" },
  { icon: User, label: "Profile", path: "/profile", match: (p: string) => p === "/profile" || p.startsWith("/profile/") },
];

export function BottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();
  const { ecommerceEnabled, settingsLoading } = useSettings();
  const showShop = ecommerceEnabled === true && !settingsLoading;
  const navItems = showShop
    ? navItemsAll
    : navItemsAll.filter((i) => i.path !== "/shop");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card rounded-none border-t border-border/50 px-1 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.match(location.pathname);
          const showCartBadge = item.path === "/shop" && itemCount > 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center py-2 px-2 sm:px-3 group min-w-0 flex-1"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 w-7 h-1 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative">
                <item.icon
                  className={`w-[1.15rem] h-[1.15rem] sm:w-5 sm:h-5 transition-colors duration-300 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {showCartBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-amber-400 text-[8px] font-bold text-amber-950 flex items-center justify-center border border-card">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </span>
              <span
                className={`text-[9px] sm:text-[10px] mt-0.5 transition-colors duration-300 truncate max-w-full ${
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
