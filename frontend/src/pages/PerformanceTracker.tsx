import { useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import { Card } from "../components/Card";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

type Result = {
  id: number;
  test_name: string;
  subject: string;
  marks: number;
  max_marks: number;
  taken_on: string;
};

export default function PerformanceTracker() {
  const [items, setItems] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthToken(getAccessToken());
    api
      .get("/api/results/")
      .then((res) => setItems(res.data))
      .catch(() =>
        setError("Could not load results. Please login and try again.")
      );
  }, []);

  const chartData = useMemo(
    () =>
      items.map((r) => ({
        name: r.test_name,
        date: r.taken_on,
        score: r.marks,
        max: r.max_marks
      })),
    [items]
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">
          Performance Tracker
        </div>
        <div className="mt-1 text-sm text-slate-500">
          Visualize marks from coaching center tests. Data comes from the Django
          `Result` model.
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <Card title="Marks Trend (Line Chart)">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 10, right: 10 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {items.length === 0 && (
          <div className="mt-3 text-sm text-slate-500">
            No results yet. Ask the teacher to add marks from the Teacher Panel.
          </div>
        )}
      </Card>

      <Card title={`All results (${items.length})`}>
        <div className="divide-y divide-slate-100">
          {items.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div>
                <div className="text-sm font-medium text-slate-900">
                  {r.test_name}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {r.subject} • {r.taken_on}
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {r.marks}/{r.max_marks}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="py-6 text-sm text-slate-500">No results found.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

