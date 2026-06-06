import { useState } from "react";
import { Pencil, Trash2, X, Clock, TrendingUp, AlertTriangle, PlusCircle, Pause } from "lucide-react";
import AddGoal from "./AddGoal";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";


const CATEGORY_ICONS = { "Education":"🎓","Child Future":"👶","Emergency":"🚨","Home":"🏠","Vehicle":"🚗","Retirement":"🌅","Medical":"🏥","Personal":"✨" };
const STATUS_STYLE   = { pending:"bg-yellow-500/20 text-yellow-400","on-track":"bg-blue-500/20 text-blue-400",completed:"bg-green-500/20 text-green-400",paused:"bg-gray-500/20 text-gray-400" };
const WARNING_STYLE  = { "low-balance":"bg-yellow-500/10 border-yellow-500/30 text-yellow-400","over-budget":"bg-red-500/10 border-red-500/30 text-red-400","risky":"bg-orange-500/10 border-orange-500/30 text-orange-400" };
const WARNING_MSG    = { "low-balance":"Low balance after contributions","over-budget":"May cause negative balance","risky":"High expense ratio detected" };
const GOAL_CATEGORIES = ["Education","Child Future","Emergency","Home","Vehicle","Retirement","Medical","Personal"];
const inputStyle = { background:"var(--bg-input)", borderColor:"var(--border)", color:"var(--text-primary)" };

// ── Edit Modal ────────────────────────────────────────────
function EditGoalModal({ darkMode, goal, onClose, onSave, income }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ title: goal.title, description: goal.description || "", category: goal.category || "Personal", saved: goal.saved, months: goal.months || 12, autoSaveEnabled: goal.autoSaveEnabled !== false });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const newMonthly = Math.max(Math.ceil(goal.target / Math.max(Number(form.months), 1)), 1000);

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/goals/${goal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: form.title, description: form.description, category: form.category, saved: Number(form.saved), months: Number(form.months), target: goal.target, autoSaveEnabled: form.autoSaveEnabled, income: income || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Update failed"); return; }
      onSave(data.data);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl shadow-2xl border p-6 sm:p-8 my-4 transition-all duration-300" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Edit Goal</h2>
          <button onClick={onClose} className="p-2 rounded-xl transition-all theme-muted" onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}><X size={20} /></button>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {GOAL_CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setForm((p) => ({ ...p, category: c }))}
                  className="flex flex-col items-center gap-1 p-2 rounded-2xl border text-xs transition-all"
                  style={form.category === c ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" } : { background: "rgba(255,255,255,0.04)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  onMouseEnter={(e) => { if (form.category !== c) e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onMouseLeave={(e) => { if (form.category !== c) e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <span className="text-lg">{CATEGORY_ICONS[c]}</span>
                  <span className="leading-tight text-center">{c}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Goal Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border transition-all duration-300" style={inputStyle} required />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border transition-all duration-300" style={inputStyle} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Amount Saved (₹)</label>
              <input type="number" min="0" value={form.saved} onChange={(e) => setForm((p) => ({ ...p, saved: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border transition-all duration-300" style={inputStyle} required />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Timeline (months)</label>
              <input type="number" min="1" value={form.months} onChange={(e) => setForm((p) => ({ ...p, months: e.target.value }))} className="w-full p-4 rounded-2xl outline-none border transition-all duration-300" style={inputStyle} />
            </div>
          </div>

          <div className="rounded-2xl p-3 text-sm" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="flex justify-between">
              <span className="theme-muted">Target: ₹{goal.target.toLocaleString()}</span>
              <span className="theme-muted">New monthly: ₹{newMonthly.toLocaleString()}/mo</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--border)" }}>
            <div>
              <p className="text-sm font-medium">Auto-save enabled</p>
              <p className="text-xs mt-0.5 theme-muted">Automatically track monthly contributions</p>
            </div>
            <button type="button" onClick={() => setForm((p) => ({ ...p, autoSaveEnabled: !p.autoSaveEnabled }))} className="w-12 h-6 rounded-full transition-all duration-300 relative" style={{ background: form.autoSaveEnabled ? "var(--accent)" : "rgba(255,255,255,0.2)" }}>
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-300" style={{ left: form.autoSaveEnabled ? "1.5rem" : "0.125rem" }} />
            </button>
          </div>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl font-semibold transition-all" style={{ background: "rgba(255,255,255,0.08)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 p-4 rounded-2xl font-semibold transition-all shadow-lg disabled:opacity-50 text-white" style={{ background: "var(--accent)" }}>{loading ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Contribute Modal ──────────────────────────────────────
function ContributeModal({ goal, onClose, onContributed }) {
  const { token } = useAuth();
  const [amount,  setAmount]  = useState(String(goal.monthlyMin || ""));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/goals/${goal._id}/contribute`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ amount: Number(amount) }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onContributed(data.data);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm rounded-3xl shadow-2xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Contribution</h2>
          <button onClick={onClose} className="p-2 rounded-xl transition-all theme-muted" onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}><X size={18} /></button>
        </div>
        <p className="text-sm mb-4 theme-muted">Goal: <span className="font-medium" style={{ color: "var(--text-primary)" }}>{goal.title}</span> · Remaining: ₹{Math.max(goal.target - goal.saved, 0).toLocaleString()}</p>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Amount (₹)</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 rounded-2xl outline-none border transition-all duration-300" style={inputStyle} required />
            {goal.monthlyMin > 0 && <p className="text-xs mt-1 theme-muted">Suggested: ₹{goal.monthlyMin.toLocaleString()}/mo</p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 p-3 rounded-2xl font-semibold transition-all" style={{ background: "rgba(255,255,255,0.08)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 p-3 rounded-2xl font-semibold text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>{loading ? "Adding..." : "Contribute"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
function SavingsGoal({ darkMode, goals = [], setGoals, income = 0 }) {
  const { token } = useAuth();
  const [showGoalForm,   setShowGoalForm]   = useState(false);
  const [editGoal,       setEditGoal]       = useState(null);
  const [contributeGoal, setContributeGoal] = useState(null);
  const activeGoals = goals.filter((g) => g.status !== "completed").length;

  async function deleteGoal(id) {
    try { await fetch(`${API_URL}/goals/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); setGoals((prev) => prev.filter((g) => g._id !== id)); }
    catch (err) { console.error(err); }
  }
  function handleSave(u)        { setGoals((prev) => prev.map((g) => (g._id === u._id ? u : g))); setEditGoal(null); }
  function handleContributed(u) { setGoals((prev) => prev.map((g) => (g._id === u._id ? u : g))); setContributeGoal(null); }

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border p-6 shadow-xl transition-all duration-500" style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl pointer-events-none" style={{ background: "var(--accent-glow)" }} />

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Savings Goals</h2>
            <p className="text-xs mt-0.5 theme-muted">{activeGoals}/5 active goals</p>
          </div>
          <button onClick={() => setShowGoalForm(true)} disabled={activeGoals >= 5} className="px-5 py-3 rounded-xl font-semibold text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "var(--accent)" }}>
            + Add Goal
          </button>
        </div>

        {goals.length === 0 && (
          <div className="rounded-2xl border p-10 text-center theme-muted" style={{ borderColor: "var(--border)" }}>
            No savings goals yet. Click "+ Add Goal" to create one.
          </div>
        )}

        <div className="space-y-6">
          {goals.map((goal) => {
            const pct      = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0;
            const remaining = Math.max(goal.target - goal.saved, 0);
            const daysLeft  = goal.monthlyMin > 0 ? Math.ceil((remaining / goal.monthlyMin) * 30) : null;

            return (
              <div key={goal._id} className="relative overflow-hidden rounded-3xl border p-6 transition-all duration-500" style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--border)" }}>
                {goal.warningStatus && goal.warningStatus !== "none" && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border mb-4 ${WARNING_STYLE[goal.warningStatus]}`}>
                    <AlertTriangle size={12} />{WARNING_MSG[goal.warningStatus]}
                  </div>
                )}

                {/* Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-1">
                  {[
                    { icon: PlusCircle, title: "Add contribution", action: () => setContributeGoal(goal), hoverColor: "#4ade80", hoverBg: "rgba(74,222,128,0.1)" },
                    { icon: Pencil,     title: "Edit",             action: () => setEditGoal(goal),       hoverColor: "var(--accent)", hoverBg: "var(--accent-glow)" },
                    { icon: Trash2,     title: "Delete",           action: () => deleteGoal(goal._id),    hoverColor: "#F87171", hoverBg: "rgba(239,68,68,0.1)" },
                  ].map(({ icon: Icon, title, action, hoverColor, hoverBg }) => (
                    <button key={title} onClick={action} className="p-2 rounded-xl transition-all theme-muted" title={title}
                      onMouseEnter={(e) => { e.currentTarget.style.color = hoverColor; e.currentTarget.style.background = hoverBg; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 pr-24 flex-wrap">
                      <span className="text-2xl">{CATEGORY_ICONS[goal.category] || "✨"}</span>
                      <h3 className="text-xl font-semibold">{goal.title}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${STATUS_STYLE[goal.status] || STATUS_STYLE.pending}`}>{goal.status}</span>
                      {goal.autoSaveEnabled === false && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 flex items-center gap-1"><Pause size={10} /> Paused</span>
                      )}
                    </div>

                    {goal.description && <p className="mt-1 text-sm theme-muted">{goal.description}</p>}

                    <div className="flex flex-wrap gap-4 mt-2">
                      <p className="text-sm theme-muted">Target: ₹{goal.target.toLocaleString()}</p>
                      {goal.monthlyMin > 0 && <p className="text-sm theme-muted">₹{goal.monthlyMin.toLocaleString()}/mo</p>}
                      {goal.targetDate && <p className="text-sm theme-muted">📅 {new Date(goal.targetDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>}
                    </div>

                    <div className="mt-4 flex items-end gap-2">
                      <h1 className="text-4xl font-bold text-green-400">₹{goal.saved.toLocaleString()}</h1>
                      <span className="mb-1 theme-muted">saved</span>
                    </div>

                    <div className="mt-4">
                      <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {daysLeft !== null && pct < 100 && <span className="flex items-center gap-1 text-xs theme-muted"><Clock size={12} /> ~{daysLeft} days left</span>}
                          {pct >= 100 && <span className="text-xs text-green-400 font-medium">Goal reached! 🎉</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp size={12} style={{ color: "var(--accent)" }} />
                          <span className="text-sm font-semibold">{Math.round(pct)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex items-center justify-center">
                    <div className="absolute h-32 w-32 rounded-full blur-3xl pointer-events-none" style={{ background: "var(--accent-glow)" }} />
                    <img src="https://cdn-icons-png.flaticon.com/512/2920/2920329.png" alt="Goal" className="relative z-10 w-28 drop-shadow-2xl" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showGoalForm && <AddGoal darkMode={darkMode} setShowGoalForm={setShowGoalForm} goals={goals} setGoals={setGoals} income={income} />}
      </div>

      {editGoal      && <EditGoalModal    darkMode={darkMode} goal={editGoal}       income={income} onClose={() => setEditGoal(null)}       onSave={handleSave}        />}
      {contributeGoal && <ContributeModal goal={contributeGoal}                     onClose={() => setContributeGoal(null)} onContributed={handleContributed} />}
    </>
  );
}

export default SavingsGoal;
