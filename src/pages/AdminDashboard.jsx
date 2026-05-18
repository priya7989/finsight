import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { Users, Trash2, UserPlus, X, TrendingUp, ShoppingBag } from "lucide-react";

const COLORS = ["#8B5CF6", "#3B82F6", "#F59E0B", "#EF4444", "#10B981", "#EC4899"];

function ChartCard({ darkMode, title, children }) {
  return (
    <div className={`rounded-2xl border shadow-xl p-6 ${darkMode ? "bg-gradient-to-br from-[#111C44] to-[#0B1739] border-white/10 text-white" : "bg-white border-gray-200 text-black"}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ── Invite Modal ──────────────────────────────────────────
function InviteModal({ darkMode, onClose, onAdded, token }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const inputCls = `w-full p-4 rounded-2xl outline-none border transition-all duration-300 ${
    darkMode ? "bg-[#0B1739] border-white/10 placeholder:text-gray-500 focus:border-violet-500 text-white" : "bg-gray-100 border-gray-300 focus:border-violet-500"
  }`;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res  = await fetch("http://localhost:5000/family/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onAdded(data.member);
      onClose();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 sm:p-8 ${darkMode ? "bg-[#111C44] border-white/10 text-white" : "bg-white border-gray-200 text-black"}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Family Member</h2>
          <button onClick={onClose} className={`p-2 rounded-xl ${darkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><X size={18} /></button>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text"     placeholder="Full name"  value={form.name}     onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}     className={inputCls} required />
          <input type="email"    placeholder="Email"      value={form.email}    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}    className={inputCls} required />
          <input type="password" placeholder="Password"   value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className={inputCls} required />
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className={`flex-1 p-4 rounded-2xl font-semibold ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-gray-200 hover:bg-gray-300"}`}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 p-4 rounded-2xl font-semibold text-white disabled:opacity-50">
              {loading ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────
function AdminDashboard({ darkMode }) {
  const { token } = useAuth();
  const [members,   setMembers]   = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [expenses,  setExpenses]  = useState([]);
  const [familyGoals, setFamilyGoals] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [filterUser, setFilterUser] = useState("all");
  const [loading,   setLoading]   = useState(true);

  const tooltipStyle = {
    contentStyle: {
      background: darkMode ? "#111C44" : "#fff",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      color: darkMode ? "#fff" : "#000",
    },
  };

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("http://localhost:5000/family/members",  { headers: h }).then((r) => r.json()),
      fetch("http://localhost:5000/family/analytics",{ headers: h }).then((r) => r.json()),
      fetch("http://localhost:5000/family/expenses", { headers: h }).then((r) => r.json()),
      fetch("http://localhost:5000/family/goals",    { headers: h }).then((r) => r.json()),
    ])
      .then(([m, a, e, g]) => {
        setMembers(Array.isArray(m) ? m : []);
        setAnalytics(a.byCategory ? a : null);
        setExpenses(Array.isArray(e) ? e : []);
        setFamilyGoals(Array.isArray(g) ? g : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  async function removeMember(id) {
    try {
      await fetch(`http://localhost:5000/family/members/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      setMembers((prev) => prev.filter((m) => m._id !== id));
    } catch (err) { console.error(err); }
  }

  const filteredExpenses = filterUser === "all"
    ? expenses
    : expenses.filter((e) => e.userId === filterUser || e.userName === filterUser);

  const totalFamily = expenses.reduce((s, e) => s + Math.abs(Number(e.amount)), 0);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Family Dashboard</h1>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-5 py-3 rounded-xl font-semibold text-white transition-all shadow-lg"
        >
          <UserPlus size={18} /> Add Member
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Family Members", val: members.length,                                  color: "text-violet-400" },
          { label: "Total Expenses", val: `₹${totalFamily.toLocaleString("en-IN")}`,       color: "text-red-400"    },
          { label: "Transactions",   val: expenses.length,                                  color: "text-blue-400"   },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Members list */}
      <div className={`rounded-2xl border p-6 ${darkMode ? "bg-gradient-to-br from-[#111C44] to-[#0B1739] border-white/10" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-violet-400" />
          <h2 className="text-lg font-semibold">Family Members</h2>
        </div>
        {members.length === 0 ? (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No members yet. Add one above.</p>
        ) : (
          <div className="space-y-3">
            {members.map((m) => {
              const memberTotal = expenses
                .filter((e) => e.userId?.toString() === m._id?.toString())
                .reduce((s, e) => s + Math.abs(Number(e.amount)), 0);
              return (
                <div key={m._id} className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold">
                      {m.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-red-400 font-semibold text-sm">₹{memberTotal.toLocaleString()}</p>
                    <button onClick={() => removeMember(m._id)} className={`p-2 rounded-xl transition-all ${darkMode ? "text-gray-400 hover:text-red-400 hover:bg-red-500/10" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics charts */}
      {analytics && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartCard darkMode={darkMode} title="Daily Spending (Family)">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.daily.map((d) => ({ name: d.date.slice(5), amount: d.amount }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(255,255,255,0.05)" : "#f0f0f0"} />
                  <XAxis dataKey="name" tick={{ fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 11 }} />
                  <YAxis tick={{ fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, "Spent"]} />
                  <Line type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard darkMode={darkMode} title="Monthly Comparison (Family)">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthly.map((d) => ({ name: d.month, amount: d.amount }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(255,255,255,0.05)" : "#f0f0f0"} />
                  <XAxis dataKey="name" tick={{ fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 11 }} />
                  <YAxis tick={{ fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, "Spent"]} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard darkMode={darkMode} title="Spending by Category">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.byCategory} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={4}>
                      {analytics.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2">
                {analytics.byCategory.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm">{c.name}</span>
                    </div>
                    <span className="text-sm font-semibold">₹{c.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard darkMode={darkMode} title="Spending by Member">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byUser} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(255,255,255,0.05)" : "#f0f0f0"} />
                  <XAxis type="number" tick={{ fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 11 }} width={70} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, "Spent"]} />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      {/* All family transactions */}
      <div className={`rounded-2xl border p-6 ${darkMode ? "bg-gradient-to-br from-[#111C44] to-[#0B1739] border-white/10" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-violet-400" />
            <h2 className="text-lg font-semibold">All Family Transactions</h2>
          </div>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className={`px-4 py-2 rounded-xl text-sm outline-none border ${darkMode ? "bg-[#0B1739] border-white/10 text-white" : "bg-gray-100 border-gray-200"}`}
          >
            <option value="all">All Members</option>
            {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        </div>

        {filteredExpenses.length === 0 ? (
          <p className={`text-sm text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No transactions found</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {filteredExpenses.slice(0, 50).map((t) => (
              <div key={t._id} className={`flex items-center justify-between p-3 rounded-2xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                <div>
                  <p className="font-medium text-sm">{t.title}</p>
                  <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {t.userName} · {t.category} · {new Date(t.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <p className="text-red-400 font-semibold text-sm">₹{Math.abs(t.amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Family Goals Summary */}
      {familyGoals.length > 0 && (
        <div className={`rounded-2xl border p-6 ${darkMode ? "bg-gradient-to-br from-[#111C44] to-[#0B1739] border-white/10" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎯</span>
            <h2 className="text-lg font-semibold">Family Savings Goals</h2>
          </div>

          {/* Goals by category summary */}
          {analytics?.goalsByCategory && analytics.goalsByCategory.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {analytics.goalsByCategory.map((gc) => (
                <div key={gc.category} className={`rounded-2xl p-3 border ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
                  <p className="text-xs font-medium">{gc.category}</p>
                  <p className="text-sm font-bold text-violet-400 mt-1">₹{gc.saved.toLocaleString()}</p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>of ₹{gc.target.toLocaleString()}</p>
                  <div className={`h-1.5 w-full rounded-full mt-2 overflow-hidden ${darkMode ? "bg-white/10" : "bg-gray-200"}`}>
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${gc.target > 0 ? Math.min((gc.saved / gc.target) * 100, 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {familyGoals.map((g) => {
              const pct = g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0;
              return (
                <div key={g._id} className={`flex items-center justify-between p-3 rounded-2xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{g.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        g.status === "completed" ? "bg-green-500/20 text-green-400"
                        : g.status === "on-track" ? "bg-blue-500/20 text-blue-400"
                        : "bg-yellow-500/20 text-yellow-400"
                      }`}>{g.status}</span>
                    </div>
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {g.userName} · {g.category}
                    </p>
                    <div className={`h-1.5 w-full rounded-full mt-2 overflow-hidden ${darkMode ? "bg-white/10" : "bg-gray-200"}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="ml-4 text-right shrink-0">
                    <p className="text-sm font-bold text-green-400">₹{g.saved.toLocaleString()}</p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>of ₹{g.target.toLocaleString()}</p>
                    <p className="text-xs font-semibold text-violet-400">{Math.round(pct)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showInvite && (
        <InviteModal
          darkMode={darkMode}
          token={token}
          onClose={() => setShowInvite(false)}
          onAdded={(m) => setMembers((prev) => [...prev, m])}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
