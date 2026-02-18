import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/layout/Footer";
export default function Layout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
