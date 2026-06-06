import { useState, useEffect } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import {
  Users, Trash2, UserPlus, X, ShoppingBag,
  ShieldOff, ShieldCheck, Target, Pencil, AlertTriangle, Check,
} from "lucide-react";

const COLORS     = ["#8B5CF6", "#3B82F6", "#F59E0B", "#EF4444", "#10B981", "#EC4899"];
const CAT_COLORS = { Food: "#F59E0B", Travel: "#3B82F6", Shopping: "#EC4899", Entertainment: "#EF4444", Other: "#10B981" };
const getCatColor = (name, i) => CAT_COLORS[name] || COLORS[i % COLORS.length];
const GOAL_CATEGORIES = ["Education","Child Future","Emergency","Home","Vehicle","Retirement","Medical","Personal"];
const inputStyle = { background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" };

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border shadow-xl p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ── Invite Modal ──────────────────────────────────────────
function InviteModal({ onClose, onAdded, token }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res  = await fetch("http://localhost:5000/family/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onAdded(data.member); onClose();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md rounded-3xl shadow-2xl border p-6 sm:p-8" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Family Member</h2>
          <button onClick={onClose} className="p-2 rounded-xl theme-muted" onMouseEnter={(e)=>{e.currentTarget.style.background="rgba(255,255,255,0.08)"}} onMouseLeave={(e)=>{e.currentTarget.style.background="transparent"}}><X size={18}/></button>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[["text","Full name","name"],["email","Email","email"],["password","Password","password"]].map(([type,ph,key])=>(
            <input key={key} type={type} placeholder={ph} value={form[key]} onChange={(e)=>setForm(p=>({...p,[key]:e.target.value}))} className="w-full p-4 rounded-2xl outline-none border transition-all" style={inputStyle} required />
          ))}
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl font-semibold" style={{background:"rgba(255,255,255,0.08)"}}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 p-4 rounded-2xl font-semibold text-white disabled:opacity-50" style={{background:"var(--accent)"}}>
              {loading ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Block Modal ───────────────────────────────────────────
function BlockModal({ member, onClose, onBlocked, token }) {
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res  = await fetch(`http://localhost:5000/family/members/${member._id}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onBlocked(data.member); onClose();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md rounded-3xl shadow-2xl border p-6 sm:p-8" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center"><ShieldOff size={18} className="text-red-400"/></div>
            <h2 className="text-xl font-bold">Block Member</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl theme-muted" onMouseEnter={(e)=>{e.currentTarget.style.background="rgba(255,255,255,0.08)"}} onMouseLeave={(e)=>{e.currentTarget.style.background="transparent"}}><X size={18}/></button>
        </div>
        <p className="text-sm theme-muted mb-5">
          Blocking <span className="font-semibold" style={{color:"var(--text-primary)"}}>{member.name}</span> will prevent them from logging in. A reason is required.
        </p>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 theme-muted">Block Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Overspending, Policy violation..."
              rows={3}
              className="w-full p-4 rounded-2xl outline-none border transition-all resize-none"
              style={inputStyle}
              required
            />
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl font-semibold" style={{background:"rgba(255,255,255,0.08)"}}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 p-4 rounded-2xl font-semibold text-white disabled:opacity-50 bg-red-600 hover:bg-red-700">
              {loading ? "Blocking..." : "Block Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Assign Goal Modal ─────────────────────────────────────
function AssignGoalModal({ members, onClose, onAssigned, token }) {
  const [form, setForm] = useState({ memberId: "", title: "", description: "", category: "Personal", target: "", months: "12" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const monthly = form.target && form.months
    ? Math.max(Math.ceil(Number(form.target) / Math.max(Number(form.months), 1)), 1000)
    : 0;

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res  = await fetch("http://localhost:5000/family/goals/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, target: Number(form.target), months: Number(form.months) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onAssigned(data.data); onClose();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl shadow-2xl border p-6 sm:p-8 my-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-glow)" }}>
              <Target size={18} style={{ color: "var(--accent)" }} />
            </div>
            <h2 className="text-xl font-bold">Assign Goal to Member</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl theme-muted" onMouseEnter={(e)=>{e.currentTarget.style.background="rgba(255,255,255,0.08)"}} onMouseLeave={(e)=>{e.currentTarget.style.background="transparent"}}><X size={18}/></button>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 theme-muted">Family Member</label>
            <select value={form.memberId} onChange={(e) => setForm(p => ({ ...p, memberId: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border" style={inputStyle} required>
              <option value="">Select member...</option>
              {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 theme-muted">Goal Category</label>
            <div className="grid grid-cols-4 gap-2">
              {GOAL_CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, category: c }))}
                  className="flex flex-col items-center gap-1 p-2 rounded-2xl border text-xs transition-all"
                  style={form.category === c ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" } : { background: "rgba(255,255,255,0.04)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  onMouseEnter={(e) => { if (form.category !== c) e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onMouseLeave={(e) => { if (form.category !== c) e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <span className="text-base">{{ Education:"🎓","Child Future":"👶",Emergency:"🚨",Home:"🏠",Vehicle:"🚗",Retirement:"🌅",Medical:"🏥",Personal:"✨" }[c]}</span>
                  <span className="leading-tight text-center">{c}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 theme-muted">Goal Title</label>
            <input type="text" placeholder="e.g. Child's Education Fund" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border" style={inputStyle} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 theme-muted">Description (optional)</label>
            <input type="text" placeholder="Short description" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 theme-muted">Target Amount (₹)</label>
              <input type="number" min="1" placeholder="e.g. 500000" value={form.target} onChange={(e) => setForm(p => ({ ...p, target: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border" style={inputStyle} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 theme-muted">Timeline (months)</label>
              <input type="number" min="1" max="360" placeholder="12" value={form.months} onChange={(e) => setForm(p => ({ ...p, months: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border" style={inputStyle} required />
            </div>
          </div>
          {monthly > 0 && (
            <div className="rounded-2xl p-3 border text-sm" style={{ background: "var(--accent-glow)", borderColor: "var(--accent)" }}>
              <span style={{ color: "var(--accent)" }}>Monthly contribution: </span>
              <span className="font-bold" style={{ color: "var(--accent)" }}>₹{monthly.toLocaleString()}/mo</span>
            </div>
          )}
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl font-semibold" style={{ background: "rgba(255,255,255,0.08)" }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 p-4 rounded-2xl font-semibold text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>
              {loading ? "Assigning..." : "Assign Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Goal Modal (admin editing member goal) ───────────
function EditGoalModal({ goal, onClose, onSaved, token }) {
  const [form, setForm] = useState({ title: goal.title, target: goal.target, months: goal.months || 12, saved: goal.saved });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res  = await fetch(`http://localhost:5000/family/goals/${goal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: form.title, target: Number(form.target), months: Number(form.months), saved: Number(form.saved) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onSaved(data.data); onClose();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md rounded-3xl shadow-2xl border p-6 sm:p-8" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Edit Member Goal</h2>
          <button onClick={onClose} className="p-2 rounded-xl theme-muted" onMouseEnter={(e)=>{e.currentTarget.style.background="rgba(255,255,255,0.08)"}} onMouseLeave={(e)=>{e.currentTarget.style.background="transparent"}}><X size={18}/></button>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 theme-muted">Goal Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border" style={inputStyle} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 theme-muted">Target (₹)</label>
              <input type="number" min="1" value={form.target} onChange={(e) => setForm(p => ({ ...p, target: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border" style={inputStyle} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 theme-muted">Months</label>
              <input type="number" min="1" value={form.months} onChange={(e) => setForm(p => ({ ...p, months: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 theme-muted">Amount Saved (₹)</label>
            <input type="number" min="0" value={form.saved} onChange={(e) => setForm(p => ({ ...p, saved: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border" style={inputStyle} />
          </div>
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl font-semibold" style={{ background: "rgba(255,255,255,0.08)" }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 p-4 rounded-2xl font-semibold text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main AdminDashboard ───────────────────────────────────
function AdminDashboard({ darkMode }) {
  const { token } = useAuth();
  const [members,     setMembers]     = useState([]);
  const [analytics,   setAnalytics]   = useState(null);
  const [expenses,    setExpenses]    = useState([]);
  const [familyGoals, setFamilyGoals] = useState([]);
  const [loading,     setLoading]     = useState(true);

  const [showInvite,     setShowInvite]     = useState(false);
  const [showAssignGoal, setShowAssignGoal] = useState(false);
  const [blockTarget,    setBlockTarget]    = useState(null);
  const [editGoalTarget, setEditGoalTarget] = useState(null);
  const [filterUser,     setFilterUser]     = useState("all");
  const [activeTab,      setActiveTab]      = useState("members"); // members | goals | analytics | blocked

  const tooltipStyle = {
    contentStyle: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-primary)" },
  };
  const tickStyle  = { fill: "var(--text-muted)", fontSize: 11 };
  const gridStroke = "rgba(255,255,255,0.05)";
  const fmtY = (v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`;

  function reload() {
    setLoading(true);
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("http://localhost:5000/family/members",   { headers: h }).then(r => r.json()),
      fetch("http://localhost:5000/family/analytics", { headers: h }).then(r => r.json()),
      fetch("http://localhost:5000/family/expenses",  { headers: h }).then(r => r.json()),
      fetch("http://localhost:5000/family/goals",     { headers: h }).then(r => r.json()),
    ])
      .then(([m, a, e, g]) => {
        setMembers(Array.isArray(m) ? m : []);
        setAnalytics(a?.byCategory ? a : null);
        setExpenses(Array.isArray(e) ? e : []);
        setFamilyGoals(Array.isArray(g) ? g : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, [token]);

  async function removeMember(id) {
    if (!window.confirm("Remove this member permanently?")) return;
    try {
      await fetch(`http://localhost:5000/family/members/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setMembers(prev => prev.filter(m => m._id !== id));
    } catch (err) { console.error(err); }
  }

  async function unblockMember(id) {
    try {
      const res  = await fetch(`http://localhost:5000/family/members/${id}/unblock`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setMembers(prev => prev.map(m => m._id === id ? { ...m, isBlocked: false, blockReason: "" } : m));
    } catch (err) { console.error(err); }
  }

  const activeMems  = members.filter(m => !m.isBlocked);
  const blockedMems = members.filter(m => m.isBlocked);
  const totalFamily = expenses.reduce((s, e) => s + Math.abs(Number(e.amount)), 0);
  const filteredExp = filterUser === "all" ? expenses : expenses.filter(e => e.userId?.toString() === filterUser);

  // Build daily stacked chart data
  const allCats = [...new Set((analytics?.daily || []).flatMap(d => (d.categories || []).map(c => c.name)))];
  const dailyChartData = (analytics?.daily || []).map(d => {
    const row = { name: d.date.slice(5), total: d.total || d.amount || 0, _raw: d };
    (d.categories || []).forEach(c => { row[c.name] = c.amount; });
    return row;
  });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
    </div>
  );

  const tabBtn = (key, label) => (
    <button key={key} onClick={() => setActiveTab(key)}
      className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
      style={activeTab === key ? { background: "var(--accent)", color: "#fff" } : { background: "rgba(255,255,255,0.07)", color: "var(--text-muted)" }}
    >{label}</button>
  );

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Family Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white text-sm transition-all shadow-lg" style={{ background: "var(--accent)" }}>
            <UserPlus size={16} /> Add Member
          </button>
          <button onClick={() => setShowAssignGoal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all" style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-primary)" }}>
            <Target size={16} /> Assign Goal
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Members",  val: activeMems.length,                              color: "text-violet-400" },
          { label: "Blocked Members", val: blockedMems.length,                             color: blockedMems.length > 0 ? "text-red-400" : "text-gray-400" },
          { label: "Total Expenses",  val: `₹${totalFamily.toLocaleString("en-IN")}`,      color: "text-red-400" },
          { label: "Family Goals",    val: familyGoals.length,                             color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-xs theme-muted">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabBtn("members",   "Members")}
        {tabBtn("goals",     "Goals")}
        {tabBtn("analytics", "Analytics")}
        {tabBtn("blocked",   `Blocked${blockedMems.length > 0 ? ` (${blockedMems.length})` : ""}`)}
      </div>

      {/* ── MEMBERS TAB ── */}
      {activeTab === "members" && (
        <div className="rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} style={{ color: "var(--accent)" }} />
            <h2 className="text-lg font-semibold">Family Members</h2>
          </div>
          {activeMems.length === 0 ? (
            <p className="text-sm theme-muted">No active members. Add one above.</p>
          ) : (
            <div className="space-y-3">
              {activeMems.map(m => {
                const memberTotal = expenses.filter(e => e.userId?.toString() === m._id?.toString()).reduce((s, e) => s + Math.abs(Number(e.amount)), 0);
                const memberGoals = familyGoals.filter(g => g.userId?.toString() === m._id?.toString());
                return (
                  <div key={m._id} className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--accent)" }}>
                        {m.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{m.name}</p>
                        <p className="text-xs theme-muted">{m.email}</p>
                        <p className="text-xs theme-muted mt-0.5">{memberGoals.length} goal{memberGoals.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-red-400 font-semibold text-sm">₹{memberTotal.toLocaleString()}</p>
                      <button onClick={() => setBlockTarget(m)} className="p-2 rounded-xl transition-all theme-muted" title="Block member"
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#F87171"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}>
                        <ShieldOff size={16} />
                      </button>
                      <button onClick={() => removeMember(m._id)} className="p-2 rounded-xl transition-all theme-muted" title="Remove member"
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#F87171"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── GOALS TAB ── */}
      {activeTab === "goals" && (
        <div className="space-y-4">
          {/* Goals by category summary */}
          {analytics?.goalsByCategory?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {analytics.goalsByCategory.map(gc => (
                <div key={gc.category} className="rounded-2xl p-3 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <p className="text-xs font-medium">{gc.category}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: "var(--accent)" }}>₹{gc.saved.toLocaleString()}</p>
                  <p className="text-xs theme-muted">of ₹{gc.target.toLocaleString()}</p>
                  <div className="h-1.5 w-full rounded-full mt-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${gc.target > 0 ? Math.min((gc.saved / gc.target) * 100, 100) : 0}%`, background: "var(--accent)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Target size={20} style={{ color: "var(--accent)" }} />
              <h2 className="text-lg font-semibold">All Family Goals</h2>
            </div>
            {familyGoals.length === 0 ? (
              <p className="text-sm theme-muted">No goals yet. Use "Assign Goal" to create one for a member.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {familyGoals.map(g => {
                  const pct = g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0;
                  return (
                    <div key={g._id} className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{g.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${g.status === "completed" ? "bg-green-500/20 text-green-400" : g.status === "on-track" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"}`}>{g.status}</span>
                          {g.isAdminAssigned && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">Admin assigned</span>}
                        </div>
                        <p className="text-xs theme-muted mt-0.5">{g.userName} · {g.category}</p>
                        <div className="h-1.5 w-full rounded-full mt-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="ml-4 text-right shrink-0 flex items-center gap-2">
                        <div>
                          <p className="text-sm font-bold text-green-400">₹{g.saved.toLocaleString()}</p>
                          <p className="text-xs theme-muted">of ₹{g.target.toLocaleString()}</p>
                          <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{Math.round(pct)}%</p>
                        </div>
                        <button onClick={() => setEditGoalTarget(g)} className="p-2 rounded-xl transition-all theme-muted"
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-glow)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                          title="Edit goal">
                          <Pencil size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transactions filter */}
          <div className="rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} style={{ color: "var(--accent)" }} />
                <h2 className="text-lg font-semibold">Family Transactions</h2>
              </div>
              <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="px-4 py-2 rounded-xl text-sm outline-none border" style={inputStyle}>
                <option value="all">All Members</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            {filteredExp.length === 0 ? (
              <p className="text-sm text-center py-8 theme-muted">No transactions found</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {filteredExp.slice(0, 50).map(t => (
                  <div key={t._id} className="flex items-center justify-between p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div>
                      <p className="font-medium text-sm">{t.title}</p>
                      <p className="text-xs theme-muted mt-0.5">{t.userName} · {t.category} · {new Date(t.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <p className="text-red-400 font-semibold text-sm">₹{Math.abs(t.amount).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-6">
          {/* Daily stacked bar */}
          <ChartCard title="Daily Spending — Category Breakdown (Last 30 Days)">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" tick={tickStyle} />
                  <YAxis tick={tickStyle} tickFormatter={fmtY} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const raw = payload[0]?.payload?._raw;
                      return (
                        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 14px", minWidth: 180 }}>
                          <p style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 6 }}>{label}</p>
                          <p style={{ color: "#EF4444", fontSize: 12, marginBottom: 4 }}>Total: ₹{(raw?.total || 0).toLocaleString("en-IN")}</p>
                          {(raw?.categories || []).map((c, i) => (
                            <div key={c.name} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: getCatColor(c.name, i), display: "inline-block" }} />
                                {c.name}
                              </span>
                              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>₹{c.amount.toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
                  {allCats.length > 0
                    ? allCats.map((cat, i) => <Bar key={cat} dataKey={cat} stackId="a" fill={getCatColor(cat, i)} radius={i === allCats.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />)
                    : <Bar dataKey="total" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  }
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard title="Monthly Comparison (Family)">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthly.map(d => ({ name: d.month, amount: d.amount }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" tick={tickStyle} />
                    <YAxis tick={tickStyle} tickFormatter={fmtY} />
                    <Tooltip {...tooltipStyle} formatter={v => [`₹${v.toLocaleString()}`, "Spent"]} />
                    <Bar dataKey="amount" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Spending by Category">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-1/2 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analytics.byCategory} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={4}>
                        {analytics.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip {...tooltipStyle} formatter={v => [`₹${v.toLocaleString()}`, ""]} />
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

            <ChartCard title="Spending by Member">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byUser} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis type="number" tick={tickStyle} tickFormatter={fmtY} />
                    <YAxis type="category" dataKey="name" tick={tickStyle} width={70} />
                    <Tooltip {...tooltipStyle} formatter={v => [`₹${v.toLocaleString()}`, "Spent"]} />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Family Goals by Category">
              {analytics.goalsByCategory?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.goalsByCategory.map(gc => {
                    const pct = gc.target > 0 ? Math.min((gc.saved / gc.target) * 100, 100) : 0;
                    return (
                      <div key={gc.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{gc.category} <span className="text-xs theme-muted">({gc.count})</span></span>
                          <span className="theme-muted">₹{gc.saved.toLocaleString()} / ₹{gc.target.toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-sm theme-muted">No goal data yet</p>}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── BLOCKED TAB ── */}
      {activeTab === "blocked" && (
        <div className="rounded-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <ShieldOff size={20} className="text-red-400" />
            <h2 className="text-lg font-semibold">Blocked Members</h2>
          </div>
          {blockedMems.length === 0 ? (
            <p className="text-sm theme-muted">No blocked members.</p>
          ) : (
            <div className="space-y-3">
              {blockedMems.map(m => (
                <div key={m._id} className="flex items-center justify-between p-4 rounded-2xl border border-red-500/20" style={{ background: "rgba(239,68,68,0.05)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm">
                      {m.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.name}</p>
                      <p className="text-xs theme-muted">{m.email}</p>
                      {m.blockReason && (
                        <p className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
                          <AlertTriangle size={10} /> {m.blockReason}
                        </p>
                      )}
                      {m.blockedAt && (
                        <p className="text-xs theme-muted">Blocked: {new Date(m.blockedAt).toLocaleDateString("en-IN")}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => unblockMember(m._id)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-green-400 transition-all"
                    style={{ background: "rgba(74,222,128,0.1)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(74,222,128,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(74,222,128,0.1)"; }}>
                    <ShieldCheck size={15} /> Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showInvite     && <InviteModal     token={token} onClose={() => setShowInvite(false)}     onAdded={m => setMembers(prev => [...prev, m])} />}
      {showAssignGoal && <AssignGoalModal token={token} members={activeMems} onClose={() => setShowAssignGoal(false)} onAssigned={g => { setFamilyGoals(prev => [g, ...prev]); }} />}
      {blockTarget    && <BlockModal      token={token} member={blockTarget} onClose={() => setBlockTarget(null)} onBlocked={updated => setMembers(prev => prev.map(m => m._id === updated._id ? { ...m, ...updated } : m))} />}
      {editGoalTarget && <EditGoalModal   token={token} goal={editGoalTarget} onClose={() => setEditGoalTarget(null)} onSaved={updated => setFamilyGoals(prev => prev.map(g => g._id === updated._id ? { ...g, ...updated } : g))} />}
    </div>
  );
}

export default AdminDashboard;
