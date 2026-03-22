import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, setAuthToken } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import { Card } from "../components/Card";

type DashboardSummary = {
  progress: {
    concepts_tracked: number;
    average_score: number;
    weak_concepts: number;
  };
  recent_results: Array<{
    id: number;
    test_name: string;
    subject: string;
    marks: number;
    max_marks: number;
    taken_on: string;
  }>;
};

type RecommendationConcept = {
  id: number;
  title: string;
  mastery_score: number;
  is_weak: boolean;
  video_url?: string | null;
  pdf_notes: Array<{ id: number; title: string; file_url: string | null }>;
};

type Recommendations = {
  user: string;
  subjects: Array<{
    id: number;
    name: string;
    next_concept: RecommendationConcept | null;
    weak_concepts: RecommendationConcept[];
  }>;
};

export default function Overview() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reco, setReco] = useState<Recommendations | null>(null);

  useEffect(() => {
    setAuthToken(getAccessToken());
    api
      .get("/api/dashboard/summary/")
      .then((res) => setData(res.data))
      .catch(() =>
        setError(
          "Could not load dashboard summary. Please login and ensure Django is running."
        )
      );

    api
      .get("/api/recommendations/next/")
      .then((res) => setReco(res.data))
      .catch(() => {
        // recommendations are optional; keep page usable
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-slate-800 p-5 text-white">
        <div className="text-sm font-semibold">Welcome back</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">
          Your learning overview
        </div>
        <div className="mt-2 text-sm text-white/80">
          Track progress, access Physics sheets, and review performance trends.
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Concepts tracked">
          <div className="text-3xl font-semibold text-slate-900">
            {data?.progress.concepts_tracked ?? "—"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Concepts with recorded progress
          </div>
        </Card>
        <Card title="Average score">
          <div className="text-3xl font-semibold text-slate-900">
            {data ? `${data.progress.average_score}%` : "—"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Based on concept attempts
          </div>
        </Card>
        <Card title="Weak concepts">
          <div className="text-3xl font-semibold text-slate-900">
            {data?.progress.weak_concepts ?? "—"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Topics that need revision focus
          </div>
        </Card>
      </div>

      <Card
        title="Today's study plan (AI-driven)"
        right={
          <Link
            className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            to="/"
          >
            Open Learning Path
          </Link>
        }
      >
        {!reco && (
          <div className="py-4 text-sm text-slate-500">
            Loading personalized plan…
          </div>
        )}
        {reco && (
          <div className="space-y-4">
            {reco.subjects.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-900">{s.name}</div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-600">
                      Next best concept
                    </div>
                    {s.next_concept ? (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {s.next_concept.title}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            Mastery: {s.next_concept.mastery_score}%
                          </div>
                        </div>
                        <Link
                          className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                          to={`/quiz/${s.next_concept.id}`}
                        >
                          Start
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-slate-500">
                        No concepts found yet for this subject.
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-white p-3">
                    <div className="text-xs font-semibold text-slate-600">
                      Weak concepts (focus)
                    </div>
                    {s.weak_concepts.length === 0 ? (
                      <div className="mt-2 text-sm text-slate-500">
                        No weak concepts detected yet.
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {s.weak_concepts.slice(0, 3).map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                          >
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {c.title}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                Mastery: {c.mastery_score}% • Recommended: video + notes
                              </div>
                            </div>
                            <Link
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              to={`/quiz/${c.id}`}
                            >
                              Practice
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          title="Quick Access • Latest Mock Questions"
          right={
            <a
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
              href="/physics-sheets"
            >
              Open sheets
            </a>
          }
        >
          <ul className="space-y-2 text-sm">
            <li className="rounded-xl bg-slate-50 p-3">
              <div className="font-medium text-slate-900">
                Electrostatics • Mixed Numericals
              </div>
              <div className="text-xs text-slate-500">
                Practice set for SSC 2027 routine
              </div>
            </li>
            <li className="rounded-xl bg-slate-50 p-3">
              <div className="font-medium text-slate-900">
                Current Electricity • Board Pattern
              </div>
              <div className="text-xs text-slate-500">
                Quick revision + key formulas
              </div>
            </li>
          </ul>
        </Card>

        <Card title="Recent test results">
          <div className="space-y-2">
            {(data?.recent_results?.length ?? 0) === 0 && (
              <div className="text-sm text-slate-500">No results found yet.</div>
            )}
            {data?.recent_results?.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {r.test_name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.subject} • {r.taken_on}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {r.marks}/{r.max_marks}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

