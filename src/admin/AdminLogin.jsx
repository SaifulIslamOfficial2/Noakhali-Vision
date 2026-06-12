import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function AdminLogin() {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("nv_token", data.token);
      localStorage.setItem("nv_user", JSON.stringify(data.user));
      nav("/admin/dashboard");
    } catch (err) {
      setErr(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-md border border-border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <img src="/logo.svg" className="h-12 w-12" alt="logo" />
          <div>
            <b className="text-2xl font-black uppercase tracking-widest">Noakhali Vision</b>
            <p className="text-sm text-muted mt-0.5">Admin Panel</p>
          </div>
        </div>

        {err && (
          <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {err}
          </div>
        )}

        <div className="grid gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wide mb-1">Email</label>
            <input
              className="w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary"
              type="email" placeholder="admin@example.com" required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wide mb-1">Password</label>
            <input
              className="w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary"
              type="password" placeholder="••••••••" required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </div>

        <button
          disabled={loading}
          className="mt-6 w-full bg-primary py-3 font-black text-white uppercase tracking-wide hover:bg-secondary transition-colors disabled:opacity-60">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
