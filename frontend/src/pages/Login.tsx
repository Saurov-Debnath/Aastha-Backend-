import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../lib/api";
import { setTokens } from "../lib/auth";
import { Card } from "../components/Card";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onLogin() {
    setError(null);
    try {
      const res = await api.post("/api/login/", { username, password });
      const access = res.data?.access;
      const refresh = res.data?.refresh;
      if (!access) throw new Error("No access token");
      setTokens(access, refresh);
      setAuthToken(access);
      navigate("/");
    } catch (e) {
      setError("Login failed. Check username/password.");
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="text-center">
        <div className="text-2xl font-semibold text-slate-900">
          Aastha Science Academy
        </div>
        <div className="mt-1 text-sm text-slate-500">
          Sign in to view materials and performance
        </div>
      </div>

      <Card title="Login">
        <div className="space-y-3">
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Username</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your username"
            />
          </label>
          <label className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Password</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="your password"
            />
          </label>
          <button
            className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            onClick={onLogin}
            disabled={!username || !password}
          >
            Sign in
          </button>
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          <div className="text-xs text-slate-500">
            Teacher accounts should be created as Django <code>is_staff</code>{" "}
            users to access the Teacher Panel APIs.
          </div>
        </div>
      </Card>
    </div>
  );
}

