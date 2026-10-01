import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

// Customer Pages
import Home from "../pages/Home";
import Shop from "../pages/Shop";
import NewArrivals from "../pages/NewArrivals";
import BestSellers from "../pages/BestSellers";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import Wishlist from "../pages/Wishlist";
import Search from "../pages/Search";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Collections from "../pages/Collections";
import About from "../pages/About";
import Contact from "../pages/Contact";

// Admin Pages
import AdminLogin from "../pages/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminAddProduct from "../pages/admin/AdminAddProduct";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminEditProduct from "../pages/admin/AdminEditProduct";
import AdminSettings from "../pages/admin/AdminSettings";
import AdminCustomers from "../pages/admin/AdminCustomers";
import AdminAnalytics from "../pages/admin/AdminAnalytics";
import AdminPasswordRecovery from "../pages/admin/AdminPasswordRecovery";
import AdminMessages from "../pages/admin/AdminMessages";

// User Pages
import Account from "../pages/user/Account";
import Profile from "../pages/user/Profile";
import Addresses from "../pages/user/Addresses";
import Checkout from "../pages/Checkout";
import OrderConfirmation from "../pages/user/OrderConfirmation";
import Orders from "../pages/user/Orders";
import OrderDetails from "../pages/user/OrderDetails";
import Settings from "../pages/user/Settings";
import ChangePassword from "../pages/user/ChangePassword";
import PasswordRecovery from "../pages/user/PasswordRecovery";

function AdminProtectedRoute({ children }) {
  const location = useLocation();

  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    const checkAdminSession = async () => {
      try {
        const response = await api.get("/admin/auth/me");

        if (
          !cancelled &&
          response.data?.success === true &&
          response.data?.admin?.role === "admin"
        ) {
          setStatus("authenticated");
          return;
        }

        if (!cancelled) {
          setStatus("unauthenticated");
        }
      } catch {
        if (!cancelled) {
          setStatus("unauthenticated");
        }
      }
    };

    checkAdminSession();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-neutral-500">
            Checking admin session
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Customer Website */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />

        <Route path="/shop" element={<Shop />} />

        <Route path="/search" element={<Search />} />

        <Route
          path="/shop/new-arrivals"
          element={<NewArrivals />}
        />

        <Route
          path="/shop/best-sellers"
          element={<BestSellers />}
        />

        <Route
          path="/product/:productId"
          element={<ProductDetails />}
        />

        <Route
          path="/collections/:gender/:category"
          element={<Collections />}
        />

        <Route path="/about" element={<About />} />

        <Route path="/contact" element={<Contact />} />

        <Route path="/cart" element={<Cart />} />

        <Route path="/wishlist" element={<Wishlist />} />

        <Route path="/account" element={<Account />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/addresses" element={<Addresses />} />

        <Route path="/checkout" element={<Checkout />} />

        <Route
          path="/order-success/:orderId"
          element={<OrderConfirmation />}
        />

        <Route path="/orders" element={<Orders />} />

        <Route
          path="/order-details/:orderId"
          element={<OrderDetails />}
        />

        <Route path="/settings" element={<Settings />} />

        <Route
          path="/change-password"
          element={<ChangePassword />}
        />
      </Route>

      {/* Customer Auth */}
      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* Admin Auth */}
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/password-recovery"
        element={<PasswordRecovery />}
      />

      {/* Protected Admin Dashboard */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        }
      />

      {/* Protected Admin Settings */}
      <Route
        path="/admin/settings"
        element={
          <AdminProtectedRoute>
            <AdminSettings />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/messages"
        element={
          <AdminProtectedRoute>
            <AdminMessages />
          </AdminProtectedRoute>
        }
      />

      {/* Protected Admin Products */}
      <Route
        path="/admin/products"
        element={
          <AdminProtectedRoute>
            <AdminProducts />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/products/add"
        element={
          <AdminProtectedRoute>
            <AdminAddProduct />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/products/edit/:id"
        element={
          <AdminProtectedRoute>
            <AdminEditProduct />
          </AdminProtectedRoute>
        }
      />

      {/* Protected Admin Orders */}
      <Route
        path="/admin/orders"
        element={
          <AdminProtectedRoute>
            <AdminOrders />
          </AdminProtectedRoute>
        }
      />

      {/* Protected Admin Customers */}
      <Route
        path="/admin/customers"
        element={
          <AdminProtectedRoute>
            <AdminCustomers />
          </AdminProtectedRoute>
        }
      />

      {/* Protected Admin Analytics */}
      <Route
        path="/admin/analytics"
        element={
          <AdminProtectedRoute>
            <AdminAnalytics />
          </AdminProtectedRoute>
        }
      />

      {/* Admin Password Recovery */}
      <Route
        path="/admin/forgot-password"
        element={<AdminPasswordRecovery />}
      />

      <Route
        path="/admin/reset-password"
        element={<AdminPasswordRecovery />}
      />
    </Routes>
  );
}

export default AppRoutes;