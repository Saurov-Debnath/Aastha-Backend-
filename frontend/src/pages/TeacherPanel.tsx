import { useMemo, useState } from "react";
import { api, setAuthToken } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import { Card } from "../components/Card";

type DraftQuestion = {
  difficulty: "L1" | "L2" | "L3";
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_ans: string;
  explanation: string;
  approved?: boolean;
};

export default function TeacherPanel() {
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialTopic, setMaterialTopic] = useState("MECH");
  const [materialDifficulty, setMaterialDifficulty] = useState("MEDIUM");
  const [materialYear, setMaterialYear] = useState("2024");
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [materialMsg, setMaterialMsg] = useState<string | null>(null);

  const [resultUserId, setResultUserId] = useState("");
  const [resultTestName, setResultTestName] = useState("");
  const [resultSubject, setResultSubject] = useState("Physics");
  const [resultMarks, setResultMarks] = useState("");
  const [resultMaxMarks, setResultMaxMarks] = useState("100");
  const [resultTakenOn, setResultTakenOn] = useState("");
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const [conceptId, setConceptId] = useState("");
  const [easyCount, setEasyCount] = useState("10");
  const [mediumCount, setMediumCount] = useState("10");
  const [hardCount, setHardCount] = useState("10");
  const [genLanguage, setGenLanguage] = useState<"English" | "Bangla">("English");
  const [genMsg, setGenMsg] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [drafts, setDrafts] = useState<DraftQuestion[]>([]);

  const isReadyMaterial = useMemo(
    () => materialTitle && materialFile,
    [materialTitle, materialFile]
  );

  async function uploadMaterial() {
    setMaterialMsg(null);
    setAuthToken(getAccessToken());
    const form = new FormData();
    form.append("title", materialTitle);
    form.append("topic", materialTopic);
    form.append("difficulty", materialDifficulty);
    if (materialYear) form.append("year", materialYear);
    if (materialFile) form.append("file", materialFile);

    try {
      await api.post("/api/teacher/materials/", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMaterialMsg("Material uploaded successfully.");
      setMaterialTitle("");
      setMaterialFile(null);
    } catch (e) {
      setMaterialMsg(
        "Upload failed. Ensure you are logged in as a staff/admin user."
      );
    }
  }

  async function createResult() {
    setResultMsg(null);
    setAuthToken(getAccessToken());
    try {
      await api.post("/api/teacher/results/", {
        user: Number(resultUserId),
        test_name: resultTestName,
        subject: resultSubject,
        marks: Number(resultMarks),
        max_marks: Number(resultMaxMarks),
        taken_on: resultTakenOn
      });
      setResultMsg("Result saved successfully.");
      setResultTestName("");
      setResultMarks("");
      setResultTakenOn("");
    } catch (e) {
      setResultMsg(
        "Saving result failed. Ensure you are logged in as a staff/admin user and values are valid."
      );
    }
  }

  async function generateQuestions() {
    setGenMsg(null);
    setDrafts([]);
    setGenLoading(true);
    setAuthToken(getAccessToken());
    try {
      const res = await api.post("/api/teacher/questions/generate/", {
        concept_id: Number(conceptId),
        easy_count: Number(easyCount),
        medium_count: Number(mediumCount),
        hard_count: Number(hardCount),
        language: genLanguage,
      });
      const items: DraftQuestion[] = (res.data?.questions ?? []).map((q: DraftQuestion) => ({
        ...q,
        approved: true,
      }));
      setDrafts(items);
      const ve = res.data?.validation_errors?.length ?? 0;
      setGenMsg(
        `Generated ${items.length} questions. Validation issues: ${ve}. Review and save approved questions.`
      );
    } catch (e) {
      setGenMsg(
        "Generation failed. Ensure GEMINI_API_KEY is set on the Django server and you are logged in as staff/admin."
      );
    } finally {
      setGenLoading(false);
    }
  }

  async function saveApproved() {
    setGenMsg(null);
    setAuthToken(getAccessToken());
    const approved = drafts.filter((d) => d.approved);
    if (approved.length === 0) {
      setGenMsg("No approved questions to save.");
      return;
    }
    try {
      const res = await api.post("/api/teacher/questions/bulk_create/", {
        concept_id: Number(conceptId),
        questions: approved.map(({ approved: _a, ...rest }) => rest),
      });
      const created = res.data?.created_count ?? 0;
      const errs = res.data?.errors?.length ?? 0;
      setGenMsg(`Saved ${created} questions. Errors: ${errs}.`);
    } catch (e) {
      setGenMsg(
        "Save failed. Ensure you are logged in as staff/admin and the draft questions are valid."
      );
    }
  }

  function updateDraft(i: number, patch: Partial<DraftQuestion>) {
    setDrafts((arr) => arr.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Teacher Panel</div>
        <div className="mt-1 text-sm text-slate-500">
          Protected actions: upload materials and update student marks (admin/staff only).
        </div>
      </div>

      <Card title="Upload new Physics material (PDF/Image)">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Title</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={materialTitle}
              onChange={(e) => setMaterialTitle(e.target.value)}
              placeholder="2024 Board Question Bank (Physics)"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Year</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={materialYear}
              onChange={(e) => setMaterialYear(e.target.value)}
              placeholder="2024"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Topic</div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={materialTopic}
              onChange={(e) => setMaterialTopic(e.target.value)}
            >
              <option value="MECH">Mechanics</option>
              <option value="ELEC">Electricity</option>
              <option value="MAG">Magnetism</option>
              <option value="OPT">Optics</option>
              <option value="MOD">Modern Physics</option>
              <option value="THERM">Thermodynamics</option>
              <option value="WAVE">Waves</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Difficulty</div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={materialDifficulty}
              onChange={(e) => setMaterialDifficulty(e.target.value)}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>
          <label className="space-y-1 md:col-span-2">
            <div className="text-xs font-semibold text-slate-600">File</div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              type="file"
              onChange={(e) => setMaterialFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            onClick={uploadMaterial}
            disabled={!isReadyMaterial}
          >
            Upload
          </button>
          {materialMsg && <div className="text-sm text-slate-600">{materialMsg}</div>}
        </div>
      </Card>

      <Card title="Add / update student marks (Result)">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">User ID</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={resultUserId}
              onChange={(e) => setResultUserId(e.target.value)}
              placeholder="e.g. 1"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <div className="text-xs font-semibold text-slate-600">Test name</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={resultTestName}
              onChange={(e) => setResultTestName(e.target.value)}
              placeholder="Weekly Test 03"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Subject</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={resultSubject}
              onChange={(e) => setResultSubject(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Marks</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={resultMarks}
              onChange={(e) => setResultMarks(e.target.value)}
              placeholder="e.g. 45"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Max marks</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={resultMaxMarks}
              onChange={(e) => setResultMaxMarks(e.target.value)}
              placeholder="100"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Taken on</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={resultTakenOn}
              onChange={(e) => setResultTakenOn(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            onClick={createResult}
            disabled={
              !resultUserId || !resultTestName || !resultMarks || !resultTakenOn
            }
          >
            Save result
          </button>
          {resultMsg && <div className="text-sm text-slate-600">{resultMsg}</div>}
        </div>
      </Card>

      <Card title="AI Question Generator (Gemini) • Concept-based">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Concept ID</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={conceptId}
              onChange={(e) => setConceptId(e.target.value)}
              placeholder="e.g. 1"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Easy (L1)</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={easyCount}
              onChange={(e) => setEasyCount(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Medium (L2)</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={mediumCount}
              onChange={(e) => setMediumCount(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Hard (L3)</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={hardCount}
              onChange={(e) => setHardCount(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Language</div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={genLanguage}
              onChange={(e) => setGenLanguage(e.target.value as "English" | "Bangla")}
            >
              <option value="English">English</option>
              <option value="Bangla">Bangla</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            onClick={generateQuestions}
            disabled={!conceptId || genLoading}
          >
            {genLoading ? "Generating…" : "Generate"}
          </button>
          <button
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            onClick={saveApproved}
            disabled={!conceptId || drafts.length === 0}
          >
            Save approved
          </button>
          {genMsg && <div className="text-sm text-slate-600">{genMsg}</div>}
        </div>

        {drafts.length > 0 && (
          <div className="mt-4 space-y-3">
            {drafts.map((d, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-600">
                    Draft #{i + 1} • {d.difficulty}
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={!!d.approved}
                      onChange={(e) => updateDraft(i, { approved: e.target.checked })}
                    />
                    Approve
                  </label>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 md:col-span-2">
                    <div className="text-xs font-semibold text-slate-600">Question</div>
                    <textarea
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={d.question}
                      rows={3}
                      onChange={(e) => updateDraft(i, { question: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <div className="text-xs font-semibold text-slate-600">Option 1</div>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={d.option1}
                      onChange={(e) => updateDraft(i, { option1: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <div className="text-xs font-semibold text-slate-600">Option 2</div>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={d.option2}
                      onChange={(e) => updateDraft(i, { option2: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <div className="text-xs font-semibold text-slate-600">Option 3</div>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={d.option3}
                      onChange={(e) => updateDraft(i, { option3: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <div className="text-xs font-semibold text-slate-600">Option 4</div>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={d.option4}
                      onChange={(e) => updateDraft(i, { option4: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <div className="text-xs font-semibold text-slate-600">
                      Correct answer (must match one option)
                    </div>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={d.correct_ans}
                      onChange={(e) => updateDraft(i, { correct_ans: e.target.value })}
                    />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <div className="text-xs font-semibold text-slate-600">Explanation</div>
                    <textarea
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={d.explanation}
                      rows={2}
                      onChange={(e) => updateDraft(i, { explanation: e.target.value })}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        Note: This route is protected by Django admin/staff permissions. Create a superuser and login to get a JWT token, then store it in localStorage as <code>aastha_token</code>.
      </div>
    </div>
  );
}

