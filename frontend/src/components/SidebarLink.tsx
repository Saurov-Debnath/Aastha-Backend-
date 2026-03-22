import { NavLink } from "react-router-dom";

export function SidebarLink({
  to,
  label
}: {
  to: string;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "block rounded-xl px-3 py-2 text-sm font-medium transition",
          isActive
            ? "bg-brand-50 text-brand-700"
            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

