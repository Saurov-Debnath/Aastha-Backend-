import { Link } from "react-router-dom";
import { Card } from "../components/Card";

function FeatureTile({
  to,
  title,
  subtitle,
  colorClass,
}: {
  to: string;
  title: string;
  subtitle: string;
  colorClass: string;
}) {
  return (
    <Link
      to={to}
      className={`block rounded-2xl p-4 text-white shadow-sm transition hover:opacity-90 ${colorClass}`}
    >
      <div className="text-base font-semibold">{title}</div>
      <div className="mt-1 text-xs text-white/90">{subtitle}</div>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 p-5 text-white">
        <div className="text-sm font-semibold">Student Dashboard</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">
          Choose a section to jump
        </div>
        <div className="mt-2 text-sm text-white/80">
          This is now jump-style navigation. Tap one option to open that page directly.
        </div>
      </div>

      <Card title="Functions">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureTile
            to="/learning-path"
            title="Learning Path"
            subtitle="Set grade and study by subject/chapter/concept"
            colorClass="bg-gradient-to-r from-orange-500 to-amber-500"
          />
          <FeatureTile
            to="/overview"
            title="Overview"
            subtitle="Daily plan and personalized recommendations"
            colorClass="bg-gradient-to-r from-emerald-500 to-green-600"
          />
          <FeatureTile
            to="/physics-sheets"
            title="Physics Sheets"
            subtitle="Open and download notes and PDFs"
            colorClass="bg-gradient-to-r from-rose-500 to-red-600"
          />
          <FeatureTile
            to="/performance"
            title="Performance Tracker"
            subtitle="See marks, trends, and weak areas"
            colorClass="bg-gradient-to-r from-sky-500 to-blue-700"
          />
          <FeatureTile
            to="/teacher"
            title="Teacher Panel"
            subtitle="Teacher/admin tools and question generation"
            colorClass="bg-gradient-to-r from-yellow-400 to-amber-500"
          />
        </div>
      </Card>
    </div>
  );
}
