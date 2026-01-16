import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Layouts
import MainLayout from "@/components/layout/MainLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import AccountLayout from "@/components/account/AccountLayout";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import NewArrivals from "./pages/NewArrivals";
import Bestsellers from "./pages/Bestsellers";
import Offers from "./pages/Offers";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Search from "./pages/Search";

// Account Pages
import Settings from "./pages/account/Settings";
import Profile from "./pages/account/Profile";
import Addresses from "./pages/account/Addresses";

// Standalone Pages
import Orders from "./pages/Orders";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminCustomers from "./pages/admin/Customers";
import AdminReturns from "./pages/admin/Returns";
import AdminCoupons from "./pages/admin/Coupons";
import AdminLoyalty from "./pages/admin/Loyalty";
import AdminReviews from "./pages/admin/Reviews";
import AdminBanners from "./pages/admin/Banners";
import AdminPages from "./pages/admin/Pages";
import AdminReports from "./pages/admin/Reports";
import AdminPayments from "./pages/admin/Payments";
import AdminShipping from "./pages/admin/Shipping";
import AdminNotifications from "./pages/admin/Notifications";
import AdminSettings from "./pages/admin/Settings";
import AdminExportCenter from "./pages/admin/ExportCenter";
import AdminInventory from "./pages/admin/Inventory";
import AdminSuppliers from "./pages/admin/Suppliers";
import AdminPurchaseOrders from "./pages/admin/PurchaseOrders";
import AdminSegments from "./pages/admin/Segments";
import AdminMarketing from "./pages/admin/Marketing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Route */}
            <Route path="/auth" element={<Auth />} />

            {/* Main Store Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/bestsellers" element={<Bestsellers />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/search" element={<Search />} />
              <Route path="/orders" element={<Orders />} />
              
              {/* Account Routes with nested layout */}
              <Route path="/account" element={<AccountLayout />}>
                <Route index element={<Profile />} />
                <Route path="addresses" element={<Addresses />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="segments" element={<AdminSegments />} />
              <Route path="returns" element={<AdminReturns />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="loyalty" element={<AdminLoyalty />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="pages" element={<AdminPages />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="shipping" element={<AdminShipping />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="suppliers" element={<AdminSuppliers />} />
              <Route path="purchase-orders" element={<AdminPurchaseOrders />} />
              <Route path="marketing" element={<AdminMarketing />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="export" element={<AdminExportCenter />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
