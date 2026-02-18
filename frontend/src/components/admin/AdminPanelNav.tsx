import { NavLink } from "react-router-dom";

const links = [
  { to: "/owner/dashboard", label: "Dashboard" },
  { to: "/owner/orders", label: "Orders" },
  { to: "/owner/products", label: "Products" },
  { to: "/owner/products/add", label: "Add Product" },
];

export default function AdminPanelNav() {
  return (
    <div className="mb-6 rounded-2xl border border-green-100 bg-white p-2 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-green-800 text-white"
                  : "text-green-800 hover:bg-green-50"
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
