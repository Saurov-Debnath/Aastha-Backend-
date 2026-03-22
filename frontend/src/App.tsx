import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/Home";
import Overview from "./pages/Overview";
import PhysicsSheets from "./pages/PhysicsSheets";
import PerformanceTracker from "./pages/PerformanceTracker";
import Routine from "./pages/Routine";
import TeacherPanel from "./pages/TeacherPanel";
import Login from "./pages/Login";
import Quiz from "./pages/Quiz";
import { getAccessToken } from "./lib/auth";

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = getAccessToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <div className="min-h-screen bg-slate-50 px-4 py-10">
            <Login />
          </div>
        }
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="overview" element={<Overview />} />
        <Route path="quiz/:conceptId" element={<Quiz />} />
        <Route path="physics-sheets" element={<PhysicsSheets />} />
        <Route path="performance" element={<PerformanceTracker />} />
        <Route path="ssc-2027-routine" element={<Routine />} />
        <Route path="teacher" element={<TeacherPanel />} />
      </Route>
    </Routes>
  );
}

