import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api, setAuthToken } from "../lib/api";
import { getAccessToken } from "../lib/auth";

export default function DashboardLayout() {
  const [username, setUsername] = useState<string>("");
  const navItems = [
    { to: "/learning-path", label: "Learning Path", active: "bg-orange-100 text-orange-700" },
    { to: "/overview", label: "Overview", active: "bg-green-100 text-green-700" },
    { to: "/physics-sheets", label: "Physics Sheets", active: "bg-red-100 text-red-700" },
    { to: "/performance", label: "Performance Tracker", active: "bg-blue-100 text-blue-700" },
    { to: "/teacher", label: "Teacher Panel", active: "bg-yellow-100 text-yellow-700" },
  ] as const;

  useEffect(() => {
    setAuthToken(getAccessToken());
    api
      .get("/api/student/profile/")
      .then((res) => setUsername(res.data?.username ?? "Student"))
      .catch(() => setUsername("Student"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-4 px-3 py-3 md:px-4 md:py-4">
        <div className="md:hidden">
          <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-semibold text-white">
                AS
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  Aastha Science Academy
                </div>
                <div className="truncate text-xs text-slate-500">
                  Student Dashboard
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "block whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition",
                      isActive ? item.active : "bg-slate-100 text-slate-700",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        <aside className="hidden w-64 shrink-0 md:block">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-semibold text-white">
                AS
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight text-slate-900">
                  Aastha Science Academy
                </div>
                <div className="text-xs text-slate-500">Student Dashboard</div>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "block rounded-xl px-3 py-2 text-sm font-medium transition",
                      isActive ? item.active : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 pb-16 md:pb-0">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">
                Aastha Science Academy
              </div>
              <div className="mt-1 text-xs font-semibold">
                <span className="bg-gradient-to-r from-fuchsia-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                  Welcome {username || "Student"}, I am your personal tutor.
                </span>
              </div>
            </div>
            <div className="p-4">
              <Outlet />
            </div>
          </div>
          <div className="mt-4 text-center text-[11px] text-slate-500">
            © {new Date().getFullYear()} Aastha Science Academy
          </div>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-2 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-5 gap-2">
          <NavLink to="/learning-path" className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[11px] font-semibold ${isActive ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-700"}`}>Path</NavLink>
          <NavLink to="/overview" className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[11px] font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>Overview</NavLink>
          <NavLink to="/physics-sheets" className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[11px] font-semibold ${isActive ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>Sheets</NavLink>
          <NavLink to="/performance" className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[11px] font-semibold ${isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>Track</NavLink>
          <NavLink to="/teacher" className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[11px] font-semibold ${isActive ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-700"}`}>Teacher</NavLink>
        </div>
      </div>
    </div>
  );
}

