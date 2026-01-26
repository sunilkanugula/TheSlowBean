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

export default function App() {
  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES ---------- */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ---------- USER ROUTES ---------- */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<MyOrders />} />
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
