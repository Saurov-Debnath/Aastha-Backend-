import { useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import { Card } from "../components/Card";

type Material = {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
  year: number | null;
  file_url: string | null;
  created_at: string;
};

const TOPICS: Array<{ value: string; label: string }> = [
  { value: "", label: "All topics" },
  { value: "MECH", label: "Mechanics" },
  { value: "ELEC", label: "Electricity" },
  { value: "MAG", label: "Magnetism" },
  { value: "OPT", label: "Optics" },
  { value: "MOD", label: "Modern Physics" },
  { value: "THERM", label: "Thermodynamics" },
  { value: "WAVE", label: "Waves" },
  { value: "OTHER", label: "Other" }
];

const DIFFICULTY: Array<{ value: string; label: string }> = [
  { value: "", label: "All difficulty" },
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" }
];

export default function PhysicsSheets() {
  const [items, setItems] = useState<Material[]>([]);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (topic) params.set("topic", topic);
    if (difficulty) params.set("difficulty", difficulty);
    if (year) params.set("year", year);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [topic, difficulty, year]);

  useEffect(() => {
    setAuthToken(getAccessToken());
    api
      .get(`/api/materials/${query}`)
      .then((res) => setItems(res.data))
      .catch(() =>
        setError("Could not load materials. Ensure Django is running.")
      );
  }, [query]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">
          Physics Sheets
        </div>
        <div className="mt-1 text-sm text-slate-500">
          Browse and download question sheets (PDF/image). Filter by topic and
          difficulty. Includes the 2024 Board Question Bank when uploaded.
        </div>
      </div>

      <Card title="Filters">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Topic</div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Difficulty</div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              {DIFFICULTY.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Year</div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="e.g. 2024"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </label>
        </div>
      </Card>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <Card title={`Sheets (${items.length})`}>
        <div className="divide-y divide-slate-100">
          {items.length === 0 && (
            <div className="py-6 text-sm text-slate-500">
              No materials found for the current filters.
            </div>
          )}
          {items.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="text-sm font-medium text-slate-900">{m.title}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  Topic: {m.topic} • Difficulty: {m.difficulty}
                  {m.year ? ` • Year: ${m.year}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {m.file_url ? (
                  <a
                    className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">No file</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

