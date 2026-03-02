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
    <div className="mb-6 rounded-3xl border border-[#d7dad7] bg-gradient-to-r from-white to-[#f5f6f5] p-2.5 shadow-[0_16px_36px_-28px_rgba(87,89,93,0.45)]">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-2xl px-4 py-2 text-sm font-semibold tracking-wide transition ${
                isActive
                  ? "bg-[#69b317] text-white shadow-[0_10px_18px_-12px_rgba(105,179,23,0.9)]"
                  : "text-[#6f7277] hover:bg-[#eef2ed] hover:text-[#57595d]"
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


