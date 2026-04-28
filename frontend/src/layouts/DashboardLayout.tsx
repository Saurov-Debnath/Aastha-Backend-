import { Outlet, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, setAuthToken } from "../lib/api";
import { getAccessToken } from "../lib/auth";

export default function DashboardLayout() {
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    setAuthToken(getAccessToken());
    api
      .get("/api/student/profile/")
      .then((res) => setUsername(res.data?.username ?? "Student"))
      .catch(() => setUsername("Student"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full max-w-md px-3 pb-20 pt-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-3xl font-semibold leading-tight text-slate-900">
                Hello, {username || "Student"}!
              </div>
              <div className="text-3xl font-semibold leading-tight text-slate-900">
                Ready to learn?
              </div>
              <div className="mt-1 inline-flex rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                Student Dashboard
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
              🔍
            </div>
          </div>
        </div>

        <div className="mt-3">
          <Outlet />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-2 shadow-[0_-4px_12px_rgba(15,23,42,0.08)]">
        <div className="mx-auto grid w-full max-w-md grid-cols-5 gap-2">
          <NavLink to="/" className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[11px] font-semibold ${isActive ? "bg-indigo-100 text-indigo-700" : "text-slate-600"}`}>Home</NavLink>
          <NavLink to="/subjects" className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[11px] font-semibold ${isActive ? "bg-orange-100 text-orange-700" : "text-slate-600"}`}>Subjects</NavLink>
          <NavLink to="/library" className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[11px] font-semibold ${isActive ? "bg-red-100 text-red-700" : "text-slate-600"}`}>Library</NavLink>
          <NavLink to="/profile" className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[11px] font-semibold ${isActive ? "bg-green-100 text-green-700" : "text-slate-600"}`}>Profile</NavLink>
          <NavLink to="/track" className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[11px] font-semibold ${isActive ? "bg-blue-100 text-blue-700" : "text-slate-600"}`}>Track</NavLink>
        </div>
      </div>
    </div>
  );
}

