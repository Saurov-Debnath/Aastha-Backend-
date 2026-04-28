import { useEffect, useState } from "react";
import { api, setAuthToken } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import { Card } from "../components/Card";

type Grade = { id: number; name: string };

export default function Profile() {
  const [username, setUsername] = useState("Student");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradeId, setGradeId] = useState<number | "">("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setAuthToken(getAccessToken());
    Promise.all([api.get("/api/student/profile/"), api.get("/api/grade/")])
      .then(([p, g]) => {
        setUsername(p.data?.username ?? "Student");
        setGrades(g.data ?? []);
        setGradeId(p.data?.grade?.id ?? "");
      })
      .catch(() => setMsg("Could not load profile details."));
  }, []);

  function saveGrade() {
    setMsg(null);
    api
      .put("/api/student/profile/", { grade_id: gradeId || null })
      .then(() => setMsg("Profile updated successfully."))
      .catch(() => setMsg("Could not update class. Please try again."));
  }

  return (
    <div className="space-y-3">
      <Card title="Profile">
        <div className="space-y-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Username</div>
            <div className="text-sm font-semibold text-slate-900">{username}</div>
          </div>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Class / Grade</div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Select your class</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            onClick={saveGrade}
          >
            Save
          </button>
          {msg && <div className="text-xs text-slate-600">{msg}</div>}
        </div>
      </Card>
    </div>
  );
}

