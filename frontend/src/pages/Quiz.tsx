import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, setAuthToken } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import { Card } from "../components/Card";

type Concept = {
  id: number;
  title: string;
  chapter: number;
  vedio_url?: string | null;
};

type Question = {
  id: number;
  concept: number;
  difficulty: "L1" | "L2" | "L3";
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
};

type SubmitResult = {
  correct: boolean;
  explanation?: string;
};

type Reco = {
  around_concept?: {
    id: number;
    title: string;
    mastery_score: number;
    is_weak: boolean;
    video_url?: string | null;
    pdf_notes: Array<{ id: number; title: string; file_url: string | null }>;
  } | null;
  subjects?: Array<{
    id: number;
    name: string;
    weak_concepts: Array<{ id: number; title: string; mastery_score: number }>;
    next_concept?: { id: number; title: string; mastery_score: number } | null;
  }>;
};

const LAYERS: Array<{ key: "L1" | "L2" | "L3"; label: string }> = [
  { key: "L1", label: "Easy" },
  { key: "L2", label: "Medium" },
  { key: "L3", label: "Hard" },
];

// LocalStorage key for which difficulty layers are unlocked per concept.
function unlockKey(conceptId: number) {
  return `aastha_unlock_${conceptId}`;
}

// LocalStorage key for "gating" actions per concept + layer (opened video / downloaded note).
function actionKey(conceptId: number, layer: "L1" | "L2" | "L3") {
  return `aastha_actions_${conceptId}_${layer}`;
}

// Backend materials API uses EASY/MEDIUM/HARD while questions use L1/L2/L3.
function layerToMaterialDifficulty(layer: "L1" | "L2" | "L3") {
  if (layer === "L1") return "EASY";
  if (layer === "L2") return "MEDIUM";
  return "HARD";
}

export default function Quiz() {
  const { conceptId } = useParams();
  const nav = useNavigate();
  const cid = Number(conceptId);

  // Concept metadata (title, video URL, etc.) shown in header & revision section.
  const [concept, setConcept] = useState<Concept | null>(null);
  // Current quiz difficulty layer being attempted.
  const [layer, setLayer] = useState<"L1" | "L2" | "L3">("L1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unlock state for this concept (persisted in localStorage).
  const [unlocked, setUnlocked] = useState<{ L2: boolean; L3: boolean }>({
    L2: false,
    L3: false,
  });
  // "Gating" actions (video open / note download) tracked per concept+layer to unlock next layer when many wrong.
  const [openedVideo, setOpenedVideo] = useState(false);
  const [downloadedNote, setDownloadedNote] = useState(false);

  // Server-provided quiz questions for current concept+layer.
  const [questions, setQuestions] = useState<Question[]>([]);
  // Current question index within the fetched set.
  const [idx, setIdx] = useState(0);
  // Which option the user clicked for the current question (UI highlight).
  const [selected, setSelected] = useState<string | null>(null);
  // Prevent double-submits while we wait for the server and advance to next question.
  const [locked, setLocked] = useState(false);

  // Score counters for the current layer attempt.
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  // Lightweight "review list" built from wrong answers (question text, chosen option, server explanation).
  const [wrongNotes, setWrongNotes] = useState<
    Array<{ q: string; chosen: string; explanation?: string }>
  >([]);

  // Optional revision materials returned from the backend (usually PDFs).
  const [materials, setMaterials] = useState<
    Array<{ id: number; title: string; file_url: string | null; difficulty: string }>
  >([]);
  const [reco, setReco] = useState<Reco | null>(null);

  // True once user has answered the whole fetched set for the layer.
  const done = idx >= questions.length && questions.length > 0;

  // Convenience pointer to the current question (memoized so handlers don't recalc per render).
  const current = useMemo(() => questions[idx], [questions, idx]);

  // Bootstrap unlock state for this concept from localStorage.
  useEffect(() => {
    if (!Number.isFinite(cid) || cid <= 0) return;
    try {
      const raw = localStorage.getItem(unlockKey(cid));
      if (raw) {
        const parsed = JSON.parse(raw) as { L2?: boolean; L3?: boolean };
        setUnlocked({ L2: !!parsed.L2, L3: !!parsed.L3 });
      }
    } catch {
      // ignore
    }
  }, [cid]);

  // Load per-layer "gating actions" (opened video / downloaded note) from localStorage whenever layer changes.
  useEffect(() => {
    if (!Number.isFinite(cid) || cid <= 0) return;
    try {
      const raw = localStorage.getItem(actionKey(cid, layer));
      if (raw) {
        const parsed = JSON.parse(raw) as {
          openedVideo?: boolean;
          downloadedNote?: boolean;
        };
        setOpenedVideo(!!parsed.openedVideo);
        setDownloadedNote(!!parsed.downloadedNote);
        return;
      }
    } catch {
      // ignore
    }
    setOpenedVideo(false);
    setDownloadedNote(false);
  }, [cid, layer]);

  // Validate params, attach auth token, and fetch concept details (title/video URL).
  useEffect(() => {
    if (!Number.isFinite(cid) || cid <= 0) {
      nav("/");
      return;
    }
    setAuthToken(getAccessToken());
    setLoading(true);
    setError(null);
    api
      .get(`/api/concept/${cid}/`)
      .then((res) => setConcept(res.data))
      .catch(() => setError("Could not load concept details."))
      .finally(() => setLoading(false));
  }, [cid, nav]);

  // Reset all per-layer attempt state when switching layers or reloading questions.
  function resetLayerState(nextLayer: "L1" | "L2" | "L3") {
    setLayer(nextLayer);
    setQuestions([]);
    setIdx(0);
    setSelected(null);
    setLocked(false);
    setCorrectCount(0);
    setWrongCount(0);
    setWrongNotes([]);
    setMaterials([]);
  }

  // Enforce unlock rules, then fetch a fresh random set of questions for the given layer.
  function loadLayerQuestions(nextLayer: "L1" | "L2" | "L3") {
    if (nextLayer === "L2" && !unlocked.L2) {
      setError("Medium layer is locked. Complete Easy layer first.");
      return;
    }
    if (nextLayer === "L3" && !unlocked.L3) {
      setError("Hard layer is locked. Complete Medium layer first.");
      return;
    }
    resetLayerState(nextLayer);
    setLoading(true);
    setError(null);
    api
      .get(`/api/questions/${cid}/?difficulty=${nextLayer}&limit=10&random=1`)
      .then((res) => setQuestions(res.data))
      .catch(() => setError("Could not load questions for this layer."))
      .finally(() => setLoading(false));
  }

  // Initial load: always start user on Easy layer when opening a concept.
  useEffect(() => {
    if (!Number.isFinite(cid) || cid <= 0) return;
    loadLayerQuestions("L1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid]);

  // Fetch revision materials for this concept at the current layer difficulty (non-blocking).
  function loadRecommendations() {
    const d = layerToMaterialDifficulty(layer);
    api
      .get(`/api/materials/?concept_id=${cid}&difficulty=${d}`)
      .then((res) => setMaterials(res.data))
      .catch(() => {
        // recommendations are optional; don't block results UI
      });
  }

  function loadBackendRecommendations() {
    api
      .get(`/api/recommendations/next/?concept_id=${cid}`)
      .then((res) => setReco(res.data))
      .catch(() => {
        // optional
      });
  }

  // Persist "gating actions" (opened video / downloaded note) to localStorage for this layer.
  function persistActions(next: { openedVideo?: boolean; downloadedNote?: boolean }) {
    if (!Number.isFinite(cid) || cid <= 0) return;
    const payload = {
      openedVideo: next.openedVideo ?? openedVideo,
      downloadedNote: next.downloadedNote ?? downloadedNote,
    };
    try {
      localStorage.setItem(actionKey(cid, layer), JSON.stringify(payload));
    } catch {
      // ignore
    }
    setOpenedVideo(!!payload.openedVideo);
    setDownloadedNote(!!payload.downloadedNote);
  }

  // Persist unlock progress (L2/L3) for this concept to localStorage.
  function setUnlockedPersist(next: { L2?: boolean; L3?: boolean }) {
    if (!Number.isFinite(cid) || cid <= 0) return;
    const merged = { ...unlocked, ...next };
    setUnlocked(merged);
    try {
      localStorage.setItem(unlockKey(cid), JSON.stringify(merged));
    } catch {
      // ignore
    }
  }

  // Submit an answer to the backend, update counters, and advance to the next question.
  async function answer(option: string) {
    if (!current || locked) return;
    setSelected(option);
    setLocked(true);
    try {
      const res = await api.post<SubmitResult>("/api/submit/", {
        question_id: current.id,
        answer: option,
      });
      if (res.data.correct) {
        setCorrectCount((x) => x + 1);
      } else {
        setWrongCount((x) => x + 1);
        setWrongNotes((arr) => [
          ...arr,
          { q: current.question, chosen: option, explanation: res.data.explanation },
        ]);
      }
    } catch (e) {
      setError("Could not submit answer. Please try again.");
      setLocked(false);
      return;
    }

    // Small delay so the selected option flash is visible before moving on.
    setTimeout(() => {
      setIdx((i) => i + 1);
      setSelected(null);
      setLocked(false);
    }, 350);
  }

  // Move the user through the layer progression (Easy → Medium → Hard → exit).
  function nextLayer() {
    if (layer === "L1") loadLayerQuestions("L2");
    else if (layer === "L2") loadLayerQuestions("L3");
    else nav("/");
  }

  // Once a layer ends, pre-load materials for the results/revision UI.
  useEffect(() => {
    if (done) {
      loadRecommendations();
      loadBackendRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // If too many wrong answers, user must open video or download note to unlock next layer.
  const gateRequired = done && wrongCount >= 5;
  const gateSatisfied = openedVideo || downloadedNote;

  // Auto-unlock the next layer when the current layer is completed and the gate is satisfied (or not required).
  useEffect(() => {
    if (!done) return;
    if (layer === "L1") {
      if (!gateRequired) setUnlockedPersist({ L2: true });
      else if (gateSatisfied) setUnlockedPersist({ L2: true });
    }
    if (layer === "L2") {
      if (!gateRequired) setUnlockedPersist({ L3: true });
      else if (gateSatisfied) setUnlockedPersist({ L3: true });
    }
    // L3 finishes the flow
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, layer, gateRequired, gateSatisfied]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-slate-900">
            Quiz • {concept?.title ?? "Concept"}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Layer:{" "}
            <span className="font-semibold text-slate-700">
              {LAYERS.find((l) => l.key === layer)?.label}
            </span>{" "}
            • 10 questions
          </div>
        </div>
        <Link className="text-sm font-semibold text-brand-700 hover:text-brand-800" to="/">
          Back
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <Card
        title="Layers"
        right={
          <span className="text-xs text-slate-500">
            Correct: <span className="font-semibold text-slate-800">{correctCount}</span>{" "}
            • Wrong: <span className="font-semibold text-slate-800">{wrongCount}</span>
          </span>
        }
      >
        <div className="flex flex-wrap gap-2">
          {LAYERS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => loadLayerQuestions(l.key)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                l.key === layer
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              disabled={
                loading ||
                (l.key === "L2" && !unlocked.L2) ||
                (l.key === "L3" && !unlocked.L3)
              }
              title={
                l.key === "L2" && !unlocked.L2
                  ? "Locked: complete Easy layer first"
                  : l.key === "L3" && !unlocked.L3
                  ? "Locked: complete Medium layer first"
                  : undefined
              }
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Medium unlocks after Easy. Hard unlocks after Medium.
        </div>
      </Card>

      <Card title="Questions">
        {loading && (
          <div className="py-6 text-sm text-slate-500">Loading…</div>
        )}

        {!loading && questions.length === 0 && (
          <div className="py-6 text-sm text-slate-500">
            No questions found for this concept/layer. Ask the teacher to add
            questions in the admin panel.
          </div>
        )}

        {!loading && questions.length > 0 && !done && current && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500">
              Question {idx + 1} / {questions.length}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-900">
              {current.question}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {[current.option1, current.option2, current.option3, current.option4].map(
                (opt, i) => (
                  <button
                    key={`${current.id}-${i}`}
                    type="button"
                    onClick={() => answer(opt)}
                    disabled={locked}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      selected === opt
                        ? "border-brand-300 bg-brand-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {opt}
                  </button>
                )
              )}
            </div>
            <div className="text-xs text-slate-500">
              Answers are checked on the server.
            </div>
          </div>
        )}

        {!loading && done && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">
                Layer completed
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Correct: <span className="font-semibold">{correctCount}</span> •
                Wrong: <span className="font-semibold">{wrongCount}</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                If you got many wrong, we will treat this concept as weak and suggest
                revision materials.
              </div>
            </div>

            {gateRequired && !gateSatisfied && (
              <Card
                title={`Unlock next layer`}
                right={
                  <span className="text-xs font-semibold text-amber-700">
                    Locked (≥ 5 wrong)
                  </span>
                }
              >
                <div className="space-y-3 text-sm text-slate-700">
                  <div>
                    You got <span className="font-semibold">{wrongCount}</span> wrong
                    answers in this layer. To continue, please do at least one:
                    <span className="font-semibold">
                      {" "}
                      open the lecture video{" "}
                    </span>
                    or <span className="font-semibold">download a PDF note</span>.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                        concept?.vedio_url
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "cursor-not-allowed bg-slate-200 text-slate-500"
                      }`}
                      href={concept?.vedio_url ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => persistActions({ openedVideo: true })}
                      aria-disabled={!concept?.vedio_url}
                    >
                      Open lecture video
                    </a>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={loadRecommendations}
                    >
                      Load PDF notes
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">
                    After you open a video or download a note, the next layer unlocks.
                  </div>
                </div>
              </Card>
            )}

            {wrongNotes.length > 0 && (
              <Card title="Weak points (from wrong answers)">
                <div className="space-y-3">
                  {wrongNotes.map((w, i) => (
                    <div key={i} className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-sm font-semibold text-slate-900">
                        {i + 1}. {w.q}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Your answer: <span className="font-semibold">{w.chosen}</span>
                      </div>
                      {w.explanation && (
                        <div className="mt-2 text-sm text-slate-700">
                          {w.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card title="Recommended revision">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-semibold text-slate-600">
                    Lecture video
                  </div>
                  {concept?.vedio_url ? (
                    <a
                      className="mt-1 inline-block font-semibold text-brand-700 hover:text-brand-800"
                      href={concept.vedio_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => persistActions({ openedVideo: true })}
                    >
                      Open concept lecture
                    </a>
                  ) : (
                    <div className="mt-1 text-slate-500">
                      No lecture video set for this concept yet.
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-600">
                    PDF notes (same difficulty layer)
                  </div>
                  {materials.length === 0 ? (
                    <div className="mt-1 text-slate-500">
                      No PDF notes uploaded for this concept/layer yet.
                    </div>
                  ) : (
                    <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200">
                      {materials.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-3 p-3"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {m.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              Difficulty: {m.difficulty}
                            </div>
                          </div>
                          {m.file_url ? (
                            <a
                              className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                              href={m.file_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => persistActions({ downloadedNote: true })}
                            >
                              Download
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">No file</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {reco?.around_concept && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-600">
                      Personalized note
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      Mastery for this concept is{" "}
                      <span className="font-semibold">
                        {reco.around_concept.mastery_score}%
                      </span>
                      {reco.around_concept.is_weak ? (
                        <span className="font-semibold text-rose-700">
                          {" "}
                          (weak — revise now)
                        </span>
                      ) : (
                        <span className="text-slate-500"> (good progress)</span>
                      )}
                      .
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => loadLayerQuestions(layer)}
              >
                Retry this layer
              </button>
              <button
                type="button"
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                  gateRequired && !gateSatisfied
                    ? "cursor-not-allowed bg-slate-400"
                    : "bg-brand-600 hover:bg-brand-700"
                }`}
                onClick={nextLayer}
                disabled={gateRequired && !gateSatisfied}
              >
                {layer === "L3" ? "Finish" : "Next layer"}
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

