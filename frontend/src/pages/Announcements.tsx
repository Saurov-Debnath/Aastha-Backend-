import { Card } from "../components/Card";

const items = [
  { title: "Weekly Test on Friday", text: "Physics + Chemistry MCQ test starts at 8:00 PM." },
  { title: "New Biology Chapter Uploaded", text: "Cell Biology notes and practice sets are now available." },
  { title: "Live Doubt Session", text: "Join Sunday evening session for chapter-wise Q&A." },
];

export default function Announcements() {
  return (
    <div className="space-y-3">
      <Card title="Class Announcements">
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-sm font-semibold text-slate-900">{it.title}</div>
              <div className="mt-1 text-xs text-slate-600">{it.text}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

