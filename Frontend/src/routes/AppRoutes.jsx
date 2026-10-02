import { lazy, Suspense, useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

// Customer Pages
const Home = lazy(() => import("../pages/Home"));
const Shop = lazy(() => import("../pages/Shop"));
const NewArrivals = lazy(() => import("../pages/NewArrivals"));
const BestSellers = lazy(() => import("../pages/BestSellers"));
const ProductDetails = lazy(() => import("../pages/ProductDetails"));
const Cart = lazy(() => import("../pages/Cart"));
const Wishlist = lazy(() => import("../pages/Wishlist"));
const Search = lazy(() => import("../pages/Search"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Collections = lazy(() => import("../pages/Collections"));
const About = lazy(() => import("../pages/About"));
const Contact = lazy(() => import("../pages/Contact"));

// Admin Pages
const AdminLogin = lazy(() => import("../pages/AdminLogin"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("../pages/admin/AdminProducts"));
const AdminAddProduct = lazy(() => import("../pages/admin/AdminAddProduct"));
const AdminOrders = lazy(() => import("../pages/admin/AdminOrders"));
const AdminEditProduct = lazy(() => import("../pages/admin/AdminEditProduct"));
const AdminSettings = lazy(() => import("../pages/admin/AdminSettings"));
const AdminCustomers = lazy(() => import("../pages/admin/AdminCustomers"));
const AdminAnalytics = lazy(() => import("../pages/admin/AdminAnalytics"));
const AdminPasswordRecovery = lazy(() => import("../pages/admin/AdminPasswordRecovery"));
const AdminMessages = lazy(() => import("../pages/admin/AdminMessages"));

// User Pages
const Account = lazy(() => import("../pages/user/Account"));
const Profile = lazy(() => import("../pages/user/Profile"));
const Addresses = lazy(() => import("../pages/user/Addresses"));
const Checkout = lazy(() => import("../pages/Checkout"));
const OrderConfirmation = lazy(() => import("../pages/user/OrderConfirmation"));
const Orders = lazy(() => import("../pages/user/Orders"));
const OrderDetails = lazy(() => import("../pages/user/OrderDetails"));
const Settings = lazy(() => import("../pages/user/Settings"));
const ChangePassword = lazy(() => import("../pages/user/ChangePassword"));
const PasswordRecovery = lazy(() => import("../pages/user/PasswordRecovery"));

function AdminProtectedRoute({ children }) {
  const location = useLocation();

  const [session, setSession] = useState({ path: location.pathname, status: "checking" });
  const status = session.path === location.pathname ? session.status : "checking";

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
          setSession({ path: location.pathname, status: "authenticated" });
          return;
        }

        if (!cancelled) {
          setSession({ path: location.pathname, status: "unauthenticated" });
        }
      } catch {
        if (!cancelled) {
          setSession({ path: location.pathname, status: "unauthenticated" });
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
    <Suspense fallback={<div role="status" className="flex min-h-screen items-center justify-center bg-black text-white">Loading...</div>}>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

export default AppRoutes;