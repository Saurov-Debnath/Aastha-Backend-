import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import { Card } from "../components/Card";

type Grade = { id: number; name: string };
type Subject = { id: number; name: string; grade: number };
type Chapter = { id: number; name: string; order: number; subject: number };
type Concept = {
  id: number;
  title: string;
  chapter: number;
  vedio_url?: string | null;
};

function Tile({
  title,
  subtitle,
  tone,
  onClick,
}: {
  title: string;
  subtitle?: string;
  tone: "grade" | "subject" | "concept" | "chapter";
  onClick: () => void;
}) {
  const cls = useMemo(() => {
    switch (tone) {
      case "grade":
        return "border-emerald-200 bg-emerald-50 hover:bg-emerald-100";
      case "subject":
        return "border-slate-200 bg-slate-50 hover:bg-slate-100";
      case "chapter":
        return "border-slate-200 bg-white hover:bg-slate-50";
      case "concept":
        return "border-slate-200 bg-gradient-to-b from-slate-50 to-white hover:from-slate-100 hover:to-white";
      default:
        return "border-slate-200 bg-white hover:bg-slate-50";
    }
  }, [tone]);

  return (
    <button
      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${cls}`}
      onClick={onClick}
      type="button"
    >
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
    </button>
  );
}

export default function Home() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);

  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    setAuthToken(getAccessToken());
    setLoading(true);
    api
      .get("/api/grade/")
      .then((res) => setGrades(res.data))
      .catch(() => setError("Could not load grades. Ensure Django is running."))
      .finally(() => setLoading(false));
  }, []);

  function pickGrade(g: Grade) {
    setSelectedGrade(g);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSubjects([]);
    setChapters([]);
    setConcepts([]);
    setError(null);
    api
      .get(`/api/subjects/${g.id}/`)
      .then((res) => setSubjects(res.data))
      .catch(() => setError("Could not load subjects for this grade."));
  }

  function pickSubject(s: Subject) {
    setSelectedSubject(s);
    setSelectedChapter(null);
    setChapters([]);
    setConcepts([]);
    setError(null);
    api
      .get(`/api/chapters/${s.id}/`)
      .then((res) => setChapters(res.data))
      .catch(() => setError("Could not load chapters for this subject."));
  }

  function pickChapter(c: Chapter) {
    setSelectedChapter(c);
    setConcepts([]);
    setError(null);
    api
      .get(`/api/concepts/${c.id}/`)
      .then((res) => setConcepts(res.data))
      .catch(() => setError("Could not load concepts for this chapter."));
  }

  function startConcept(concept: Concept) {
    nav(`/quiz/${concept.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-slate-800 p-5 text-white">
        <div className="text-sm font-semibold">Learning Path</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">
          Choose Grade → Subject → Chapter → Concept
        </div>
        <div className="mt-2 text-sm text-white/80">
          After choosing a concept, you will get 3 layers of questions: Easy,
          Medium, Hard.
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <Card title="Grades">
        {loading && (
          <div className="py-6 text-sm text-slate-500">Loading grades…</div>
        )}
        {!loading && grades.length === 0 && (
          <div className="py-6 text-sm text-slate-500">No grades found.</div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {grades.map((g) => (
            <Tile
              key={g.id}
              title={g.name}
              subtitle="Click to see subjects"
              tone="grade"
              onClick={() => pickGrade(g)}
            />
          ))}
        </div>
      </Card>

      {selectedGrade && (
        <Card title={`Subjects • ${selectedGrade.name}`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <Tile
                key={s.id}
                title={s.name}
                subtitle="Click to see chapters"
                tone="subject"
                onClick={() => pickSubject(s)}
              />
            ))}
            {subjects.length === 0 && (
              <div className="py-6 text-sm text-slate-500">
                No subjects found for this grade.
              </div>
            )}
          </div>
        </Card>
      )}

      {selectedSubject && (
        <Card title={`Chapters • ${selectedSubject.name}`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chapters
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((c) => (
                <Tile
                  key={c.id}
                  title={c.name}
                  subtitle="Click to see concepts"
                  tone="chapter"
                  onClick={() => pickChapter(c)}
                />
              ))}
            {chapters.length === 0 && (
              <div className="py-6 text-sm text-slate-500">
                No chapters found for this subject.
              </div>
            )}
          </div>
        </Card>
      )}

      {selectedChapter && (
        <Card title={`Concepts• ${selectedChapter.name}`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {concepts.map((c) => (
              <Tile
                key={c.id}
                title={c.title}
                subtitle="Start 3-layer quiz"
                tone="concept"
                onClick={() => startConcept(c)}
              />
            ))}
            {concepts.length === 0 && (
              <div className="py-6 text-sm text-slate-500">
                No concepts found for this chapter.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}


