import { NavLink } from "react-router-dom";

const links = [
  { to: "/owner/dashboard", label: "Dashboard" },
  { to: "/owner/orders", label: "Orders" },
  { to: "/owner/products", label: "Products" },
  { to: "/owner/collections", label: "Collections" },
  { to: "/owner/products/add", label: "Add Product" },
];

export default function AdminPanelNav() {
  return (
    <div className="mb-6 rounded-3xl border border-[#bfd2c7] bg-white/95 p-2.5 shadow-[0_20px_50px_-35px_rgba(18,53,44,0.5)]">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-2xl px-4 py-2 text-sm font-semibold tracking-wide transition ${
                isActive
                  ? "bg-[#143b2f] text-white shadow"
                  : "text-[#1a5848] hover:bg-[#edf5ef]"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
