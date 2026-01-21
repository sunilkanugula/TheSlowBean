import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Layout from "./components/Layout";
import CreateProduct from "./pages/CreateProduct";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Routes with Header */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
         <Route path="/create" element={<CreateProduct />} />
      </Route>
    </Routes>
  );
}
