import { Card } from "../components/Card";

export default function Routine() {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">SSC 2027 Routine</div>
        <div className="mt-1 text-sm text-slate-500">
          A dedicated routine page for SSC 2027 students. (You can replace this
          placeholder with your real timetable.)
        </div>
      </div>

      <Card title="Weekly Routine (Sample)">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { day: "Monday", plan: "Physics Concepts + MCQ practice" },
            { day: "Tuesday", plan: "Numericals + Doubt clearing" },
            { day: "Wednesday", plan: "Board question bank (2024) practice" },
            { day: "Thursday", plan: "Mock test + review mistakes" },
            { day: "Friday", plan: "Revision + formula sheet" },
            { day: "Saturday", plan: "Full syllabus test (alternate weeks)" },
            { day: "Sunday", plan: "Performance analysis + weak topic focus" }
          ].map((x) => (
            <div key={x.day} className="rounded-xl bg-slate-50 p-3">
              <div className="text-sm font-semibold text-slate-900">{x.day}</div>
              <div className="mt-0.5 text-sm text-slate-600">{x.plan}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

