import { Outlet } from "react-router-dom";
import { SidebarLink } from "../components/SidebarLink";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-4 px-4 py-4">
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
              <SidebarLink to="/" label="Learning Path" />
              <SidebarLink to="/overview" label="Overview" />
              <SidebarLink to="/physics-sheets" label="Physics Sheets" />
              <SidebarLink to="/performance" label="Performance Tracker" />
              <SidebarLink to="/ssc-2027-routine" label="SSC 2027 Routine" />
              <div className="pt-2">
                <div className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Teacher
                </div>
                <div className="mt-1">
                  <SidebarLink to="/teacher" label="Teacher Panel" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">
                Aastha Science Academy
              </div>
              <div className="text-xs text-slate-500">
                Blue / White / Gray educational theme
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
    </div>
  );
}

