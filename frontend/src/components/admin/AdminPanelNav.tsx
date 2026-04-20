import { NavLink } from "react-router-dom";

const links = [
  { to: "/owner/dashboard", label: "Dashboard" },
  { to: "/owner/orders", label: "Orders" },
  { to: "/owner/products", label: "Products" },
  { to: "/owner/products/add", label: "Add Product" },
  { to: "/owner/coupons", label: "Coupons" },
];

export default function AdminPanelNav() {
  return (
    <div className="mb-6 rounded-lg border border-[#d9dfd8] bg-gradient-to-r from-white to-[#f6f7f4] p-2.5 shadow-[0_16px_36px_-28px_rgba(87,89,93,0.45)]">
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `shrink-0 rounded-lg px-4 py-2 text-sm font-semibold tracking-wide transition ${
                isActive
                  ? "bg-[#287a55] text-white shadow-[0_10px_18px_-12px_rgba(105,179,23,0.9)]"
                  : "text-[#5f6568] hover:bg-[#edf2ee] hover:text-[#202326]"
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


