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
      className={`block rounded-2xl p-4 shadow-sm transition hover:opacity-90 ${colorClass}`}
    >
      <div className="text-base font-semibold">{title}</div>
      <div className="mt-1 text-xs opacity-90">{subtitle}</div>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="space-y-3">
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 gap-3">
          <FeatureTile
            to="/subjects"
            title="Learning Path"
            subtitle="Set personalized subject & chapter goals."
            colorClass="bg-gradient-to-br from-teal-300 to-cyan-300 text-slate-900"
          />
          <FeatureTile
            to="/track"
            title="My Progress"
            subtitle="View test scores and weak areas."
            colorClass="bg-gradient-to-br from-orange-200 to-amber-200 text-slate-900"
          />
          <FeatureTile
            to="/library"
            title="Study Material"
            subtitle="Access notes, PDFs and question banks."
            colorClass="bg-gradient-to-br from-rose-200 to-red-200 text-slate-900"
          />
          <FeatureTile
            to="/announcements"
            title="Class Announcements"
            subtitle="Latest updates from Aastha Academy."
            colorClass="bg-gradient-to-br from-blue-200 to-indigo-200 text-slate-900"
          />
        </div>
      </Card>
    </div>
  );
}
