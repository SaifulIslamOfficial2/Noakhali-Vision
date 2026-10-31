import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      setErr((err.response?.data?.message || "Invalid email or password") + (err.response?.status ? ` (HTTP ${err.response.status})` : ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-md border border-border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <img src="/noakhali-vision-wordmark.png" className="h-auto w-44 max-w-[55vw] object-contain" alt="Noakhali Vision" />
          <div>
            <p className="text-sm font-black text-primary">Admin Panel</p>
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
              type={showPassword ? "text" : "password"} placeholder="পাসওয়ার্ড লিখুন" required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />} {showPassword ? "Hide password" : "Show password"}
            </button>
          </div>
        </div>

        <button
          disabled={loading}
          className="mt-6 w-full bg-primary py-3 font-black text-white uppercase tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-60">
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
