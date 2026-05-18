import { useState } from "react";
import { Pencil, Trash2, X, Clock, TrendingUp, AlertTriangle, PlusCircle, Pause, Play } from "lucide-react";
import AddGoal from "./AddGoal";
import { useAuth } from "../context/AuthContext";

const CATEGORY_ICONS = {
  "Education":    "🎓",
  "Child Future": "👶",
  "Emergency":    "🚨",
  "Home":         "🏠",
  "Vehicle":      "🚗",
  "Retirement":   "🌅",
  "Medical":      "🏥",
  "Personal":     "✨",
};

const STATUS_STYLE = {
  pending:    "bg-yellow-500/20 text-yellow-400",
  "on-track": "bg-blue-500/20 text-blue-400",
  completed:  "bg-green-500/20 text-green-400",
  paused:     "bg-gray-500/20 text-gray-400",
};

const WARNING_STYLE = {
  "low-balance": "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  "over-budget": "bg-red-500/10 border-red-500/30 text-red-400",
  "risky":       "bg-orange-500/10 border-orange-500/30 text-orange-400",
};

const WARNING_MSG = {
  "low-balance": "Low balance after contributions",
  "over-budget": "May cause negative balance",
  "risky":       "High expense ratio detected",
};

const GOAL_CATEGORIES = [
  "Education", "Child Future", "Emergency", "Home",
  "Vehicle", "Retirement", "Medical", "Personal",
];

// ── Edit Modal ────────────────────────────────────────────
function EditGoalModal({ darkMode, goal, onClose, onSave, income }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    title:       goal.title,
    description: goal.description || "",
    category:    goal.category || "Personal",
    saved:       goal.saved,
    months:      goal.months || 12,
    autoSaveEnabled: goal.autoSaveEnabled !== false,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const inputCls = `w-full p-4 rounded-2xl outline-none border transition-all duration-300 ${
    darkMode
      ? "bg-[#0B1739] border-white/10 placeholder:text-gray-500 focus:border-violet-500 text-white"
      : "bg-gray-100 border-gray-300 placeholder:text-gray-400 focus:border-violet-500 text-black"
  }`;

  const newMonthly = Math.max(Math.ceil(goal.target / Math.max(Number(form.months), 1)), 1000);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`http://localhost:5000/goals/${goal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title:           form.title,
          description:     form.description,
          category:        form.category,
          saved:           Number(form.saved),
          months:          Number(form.months),
          target:          goal.target,
          autoSaveEnabled: form.autoSaveEnabled,
          income:          income || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Update failed"); return; }
      onSave(data.data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl border p-6 sm:p-8 my-4 transition-all duration-300 ${
        darkMode ? "bg-[#111C44] border-white/10 text-white" : "bg-white border-gray-200 text-black"
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Edit Goal</h2>
          <button onClick={onClose} className={`p-2 rounded-xl transition-all ${darkMode ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500"}`}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {GOAL_CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setForm((p) => ({ ...p, category: c }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-2xl border text-xs transition-all ${
                    form.category === c
                      ? "bg-violet-600 border-violet-500 text-white"
                      : darkMode ? "bg-white/5 border-white/10 text-gray-300 hover:border-violet-500/50" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-400"
                  }`}>
                  <span className="text-lg">{CATEGORY_ICONS[c]}</span>
                  <span className="leading-tight text-center">{c}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Goal Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputCls} required />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputCls} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Amount Saved (₹)</label>
              <input type="number" min="0" value={form.saved} onChange={(e) => setForm((p) => ({ ...p, saved: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Timeline (months)</label>
              <input type="number" min="1" value={form.months} onChange={(e) => setForm((p) => ({ ...p, months: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div className={`rounded-2xl p-3 text-sm ${darkMode ? "bg-white/5 text-gray-400" : "bg-gray-50 text-gray-500"}`}>
            <div className="flex justify-between">
              <span>Target: ₹{goal.target.toLocaleString()}</span>
              <span>New monthly: ₹{newMonthly.toLocaleString()}/mo</span>
            </div>
          </div>

          {/* Auto-save toggle */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
            <div>
              <p className="text-sm font-medium">Auto-save enabled</p>
              <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Automatically track monthly contributions</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, autoSaveEnabled: !p.autoSaveEnabled }))}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${form.autoSaveEnabled ? "bg-violet-600" : darkMode ? "bg-white/20" : "bg-gray-300"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-300 ${form.autoSaveEnabled ? "left-6" : "left-0.5"}`} />
            </button>
          </div>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className={`flex-1 p-4 rounded-2xl font-semibold transition-all ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-gray-200 hover:bg-gray-300"}`}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 p-4 rounded-2xl font-semibold transition-all shadow-lg disabled:opacity-50 text-white">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Contribute Modal ──────────────────────────────────────
function ContributeModal({ darkMode, goal, onClose, onContributed }) {
  const { token } = useAuth();
  const [amount,  setAmount]  = useState(String(goal.monthlyMin || ""));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`http://localhost:5000/goals/${goal._id}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onContributed(data.data);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  const inputCls = `w-full p-4 rounded-2xl outline-none border transition-all duration-300 ${
    darkMode ? "bg-[#0B1739] border-white/10 focus:border-violet-500 text-white" : "bg-gray-100 border-gray-300 focus:border-violet-500"
  }`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl border p-6 ${darkMode ? "bg-[#111C44] border-white/10 text-white" : "bg-white border-gray-200 text-black"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Contribution</h2>
          <button onClick={onClose} className={`p-2 rounded-xl ${darkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><X size={18} /></button>
        </div>
        <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Goal: <span className="font-medium">{goal.title}</span> · Remaining: ₹{Math.max(goal.target - goal.saved, 0).toLocaleString()}
        </p>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Amount (₹)</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} required />
            {goal.monthlyMin > 0 && (
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Suggested: ₹{goal.monthlyMin.toLocaleString()}/mo</p>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className={`flex-1 p-3 rounded-2xl font-semibold ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-gray-200 hover:bg-gray-300"}`}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 p-3 rounded-2xl font-semibold text-white disabled:opacity-50">
              {loading ? "Adding..." : "Contribute"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
function SavingsGoal({ darkMode, goals = [], setGoals, income = 0 }) {
  const { token } = useAuth();
  const [showGoalForm,    setShowGoalForm]    = useState(false);
  const [editGoal,        setEditGoal]        = useState(null);
  const [contributeGoal,  setContributeGoal]  = useState(null);

  const activeGoals = goals.filter((g) => g.status !== "completed").length;

  async function deleteGoal(id) {
    try {
      await fetch(`http://localhost:5000/goals/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setGoals((prev) => prev.filter((g) => g._id !== id));
    } catch (err) { console.error(err); }
  }

  function handleSave(updated) {
    setGoals((prev) => prev.map((g) => (g._id === updated._id ? updated : g)));
    setEditGoal(null);
  }

  function handleContributed(updated) {
    setGoals((prev) => prev.map((g) => (g._id === updated._id ? updated : g)));
    setContributeGoal(null);
  }

  return (
    <>
      <div className={`relative overflow-hidden rounded-3xl border p-6 shadow-xl transition-all duration-500 ${
        darkMode ? "border-white/10 bg-gradient-to-br from-[#111C44] to-[#0B1739] text-white" : "border-gray-200 bg-white text-black"
      }`}>
        {darkMode && <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />}

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Savings Goals</h2>
            <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {activeGoals}/5 active goals
            </p>
          </div>
          <button
            onClick={() => setShowGoalForm(true)}
            disabled={activeGoals >= 5}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 rounded-xl font-semibold text-white transition-all shadow-lg"
          >
            + Add Goal
          </button>
        </div>

        {goals.length === 0 && (
          <div className={`rounded-2xl border p-10 text-center ${darkMode ? "border-white/10 text-gray-400" : "border-gray-200 text-gray-500"}`}>
            No savings goals yet. Click "+ Add Goal" to create one.
          </div>
        )}

        <div className="space-y-6">
          {goals.map((goal) => {
            const pct       = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0;
            const remaining = Math.max(goal.target - goal.saved, 0);
            const daysLeft  = goal.monthlyMin > 0 ? Math.ceil((remaining / goal.monthlyMin) * 30) : null;
            const catIcon   = CATEGORY_ICONS[goal.category] || "✨";

            return (
              <div key={goal._id} className={`relative overflow-hidden rounded-3xl border p-6 transition-all duration-500 ${
                darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
              }`}>
                {/* Warning banner */}
                {goal.warningStatus && goal.warningStatus !== "none" && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border mb-4 ${WARNING_STYLE[goal.warningStatus]}`}>
                    <AlertTriangle size={12} />
                    {WARNING_MSG[goal.warningStatus]}
                  </div>
                )}

                {/* Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-1">
                  <button onClick={() => setContributeGoal(goal)} className={`p-2 rounded-xl transition-all ${darkMode ? "text-gray-400 hover:text-green-400 hover:bg-green-500/10" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`} title="Add contribution">
                    <PlusCircle size={16} />
                  </button>
                  <button onClick={() => setEditGoal(goal)} className={`p-2 rounded-xl transition-all ${darkMode ? "text-gray-400 hover:text-violet-400 hover:bg-violet-500/10" : "text-gray-400 hover:text-violet-600 hover:bg-violet-50"}`} title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => deleteGoal(goal._id)} className={`p-2 rounded-xl transition-all ${darkMode ? "text-gray-400 hover:text-red-400 hover:bg-red-500/10" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    {/* Category + title + status */}
                    <div className="flex items-center gap-3 pr-24 flex-wrap">
                      <span className="text-2xl">{catIcon}</span>
                      <h3 className="text-xl font-semibold">{goal.title}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${STATUS_STYLE[goal.status] || STATUS_STYLE.pending}`}>
                        {goal.status}
                      </span>
                      {goal.autoSaveEnabled === false && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 flex items-center gap-1">
                          <Pause size={10} /> Paused
                        </span>
                      )}
                    </div>

                    {goal.description && (
                      <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{goal.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-2">
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Target: ₹{goal.target.toLocaleString()}
                      </p>
                      {goal.monthlyMin > 0 && (
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          ₹{goal.monthlyMin.toLocaleString()}/mo
                        </p>
                      )}
                      {goal.targetDate && (
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          📅 {new Date(goal.targetDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>

                    {/* Saved */}
                    <div className="mt-4 flex items-end gap-2">
                      <h1 className={`text-4xl font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                        ₹{goal.saved.toLocaleString()}
                      </h1>
                      <span className={`mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>saved</span>
                    </div>

                    {/* Progress */}
                    <div className="mt-4">
                      <div className={`h-3 w-full overflow-hidden rounded-full ${darkMode ? "bg-white/10" : "bg-gray-200"}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {daysLeft !== null && pct < 100 && (
                            <span className={`flex items-center gap-1 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              <Clock size={12} /> ~{daysLeft} days left
                            </span>
                          )}
                          {pct >= 100 && <span className="text-xs text-green-400 font-medium">Goal reached! 🎉</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp size={12} className="text-violet-400" />
                          <span className={`text-sm font-semibold ${darkMode ? "text-white" : "text-black"}`}>{Math.round(pct)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Illustration */}
                  <div className="relative flex items-center justify-center">
                    {darkMode && <div className="absolute h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />}
                    <img src="https://cdn-icons-png.flaticon.com/512/2920/2920329.png" alt="Goal" className="relative z-10 w-28 drop-shadow-2xl" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showGoalForm && (
          <AddGoal darkMode={darkMode} setShowGoalForm={setShowGoalForm} goals={goals} setGoals={setGoals} income={income} />
        )}
      </div>

      {editGoal && (
        <EditGoalModal darkMode={darkMode} goal={editGoal} income={income} onClose={() => setEditGoal(null)} onSave={handleSave} />
      )}

      {contributeGoal && (
        <ContributeModal darkMode={darkMode} goal={contributeGoal} onClose={() => setContributeGoal(null)} onContributed={handleContributed} />
      )}
    </>
  );
}

export default SavingsGoal;
