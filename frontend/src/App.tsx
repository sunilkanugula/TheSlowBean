import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Layout from "./components/Layout";

import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import MyOrders from "./pages/MyOrders";

import CreateProduct from "./pages/CreateProduct";
import EditProduct from "./pages/EditProduct";
import OwnerProducts from "./pages/OwnerProducts";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerOrders from "./pages/OwnerOrders";

import AdminRoute from "./components/AdminRoute";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyResetOTP from "./pages/VerifyResetOTP";
import MyAccount from "./pages/MyAccount";
import ChangePassword from "./pages/ChangePassword";
import Orders from "./pages/Orders";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderDetail from "./pages/OrderDetail";

export default function App() {
  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES ---------- */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword/>} />
      <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/change-password" element={<ChangePassword />} />

      {/* ---------- USER ROUTES ---------- */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success/:id" element={<OrderSuccess />} />
        <Route path="/orders" element={<MyOrders/>} />
        <Route path="/orders/:id" element={<OrderDetail/>} />
        <Route path="/my-account" element={<MyAccount />} />

      </Route>

      {/* ---------- OWNER / ADMIN ROUTES ---------- */}
      <Route element={<AdminRoute />}>
        <Route element={<Layout />}>
          <Route
            path="/owner/dashboard"
            element={<OwnerDashboard />}
          />
          <Route
            path="/owner/orders"
            element={<OwnerOrders />}
          />
          <Route
            path="/owner/products"
            element={<OwnerProducts />}
          />
          <Route
            path="/owner/products/add"
            element={<CreateProduct />}
          />
          <Route
            path="/owner/products/edit/:id"
            element={<EditProduct />}
          />
        </Route>
      </Route>
    </Routes>
  );
}
