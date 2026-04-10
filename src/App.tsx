import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { CartProvider } from "@/contexts/CartContext";
import { EcommerceGate } from "@/components/EcommerceGate";
import Auth from "./pages/Auth";
import CustomerHome from "./pages/customer/CustomerHome";
import Services from "./pages/customer/Services";
import BookService from "./pages/customer/BookService";
import Bookings from "./pages/customer/Bookings";
import Profile from "./pages/customer/Profile";
import WorkerRegister from "./pages/worker/WorkerRegister";
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerEmergency from "./pages/worker/Emergency";
import WorkerHelpCenter from "./pages/worker/HelpCenter";
import CustomerHelpCenter from "./pages/customer/HelpCenter";
import SupportForm from "./pages/shared/SupportForm";
import UserTickets from "./pages/shared/UserTickets";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminRoute from "./components/AdminRoute";
import NotFound from "./pages/NotFound";
import CustomerTracking from "./pages/customer/Tracking";
import WorkerTracking from "./pages/worker/Tracking";
import MyReviews from "./pages/customer/profile/MyReviews";
import PrivacySecurity from "./pages/customer/profile/PrivacySecurity";
import HelpSupport from "./pages/customer/profile/HelpSupport";
import Settings from "./pages/customer/profile/Settings";
import Shop from "./pages/shop/Shop";
import ShopCart from "./pages/shop/Cart";
import ShopCheckout from "./pages/shop/Checkout";
import ShopOrders from "./pages/shop/MyOrders";
import ShopOrderDetail from "./pages/shop/OrderDetail";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><CustomerHome /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
            <Route path="/book/:id" element={<ProtectedRoute><BookService /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/worker/register" element={<ProtectedRoute><WorkerRegister /></ProtectedRoute>} />
            <Route path="/worker" element={<ProtectedRoute><WorkerDashboard /></ProtectedRoute>} />
            <Route path="/worker/emergency" element={<ProtectedRoute><WorkerEmergency /></ProtectedRoute>} />
            <Route path="/worker/help" element={<ProtectedRoute><WorkerHelpCenter /></ProtectedRoute>} />
            <Route path="/worker/tracking/:id" element={<ProtectedRoute><WorkerTracking /></ProtectedRoute>} />
            <Route path="/customer/help" element={<ProtectedRoute><CustomerHelpCenter /></ProtectedRoute>} />
            <Route path="/customer/tracking/:id" element={<ProtectedRoute><CustomerTracking /></ProtectedRoute>} />
            <Route path="/support/ticket" element={<ProtectedRoute><SupportForm /></ProtectedRoute>} />
            <Route path="/support/tickets" element={<ProtectedRoute><UserTickets /></ProtectedRoute>} />
            <Route path="/profile/reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
            <Route path="/profile/privacy" element={<ProtectedRoute><PrivacySecurity /></ProtectedRoute>} />
            <Route path="/profile/help" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
            <Route path="/profile/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/shop" element={<ProtectedRoute><EcommerceGate><Shop /></EcommerceGate></ProtectedRoute>} />
            <Route path="/shop/cart" element={<ProtectedRoute><EcommerceGate><ShopCart /></EcommerceGate></ProtectedRoute>} />
            <Route path="/shop/checkout" element={<ProtectedRoute><EcommerceGate><ShopCheckout /></EcommerceGate></ProtectedRoute>} />
            <Route path="/shop/orders" element={<ProtectedRoute><EcommerceGate><ShopOrders /></EcommerceGate></ProtectedRoute>} />
            <Route path="/shop/orders/:id" element={<ProtectedRoute><EcommerceGate><ShopOrderDetail /></EcommerceGate></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
