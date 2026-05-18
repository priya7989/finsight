import { useState, useMemo } from "react";
import { X, AlertTriangle, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const GOAL_CATEGORIES = [
  { label: "Education",    icon: "🎓", value: "Education"    },
  { label: "Child Future", icon: "👶", value: "Child Future" },
  { label: "Emergency",    icon: "🚨", value: "Emergency"    },
  { label: "Home",         icon: "🏠", value: "Home"         },
  { label: "Vehicle",      icon: "🚗", value: "Vehicle"      },
  { label: "Retirement",   icon: "🌅", value: "Retirement"   },
  { label: "Medical",      icon: "🏥", value: "Medical"      },
  { label: "Personal",     icon: "✨", value: "Personal"     },
];

const WARNING_MSG = {
  "low-balance":  "⚠️ Your balance after this goal will be very low. Consider reducing the monthly contribution.",
  "over-budget":  "🚨 This goal may push you into negative balance. Reduce contribution or increase income.",
  "risky":        "⚠️ Your expenses are already high (>80% of income). This goal may be risky.",
};

function AddGoal({ darkMode, setShowGoalForm, goals, setGoals, income = 0 }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    title: "", description: "", category: "Personal",
    target: "", months: "12", saved: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [warning, setWarning] = useState("");

  // Smart calculation preview
  const preview = useMemo(() => {
    const t = Number(form.target) || 0;
    const m = Math.max(Number(form.months) || 12, 1);
    const monthly = t > 0 ? Math.max(Math.ceil(t / m), 1000) : 0;
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + m);
    return { monthly, targetDate: targetDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" }) };
  }, [form.target, form.months]);

  const inputCls = `w-full p-4 rounded-2xl outline-none border transition-all duration-300 ${
    darkMode
      ? "bg-[#0B1739] border-white/10 placeholder:text-gray-500 focus:border-violet-500 text-white"
      : "bg-gray-100 border-gray-300 placeholder:text-gray-400 focus:border-violet-500 text-black"
  }`;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setWarning("");
    if (goals.filter((g) => g.status !== "completed").length >= 5) {
      setError("Maximum 5 active goals allowed.");
      return;
    }
    setLoading(true);
    try {
      const body = {
        title:       form.title,
        description: form.description,
        category:    form.category,
        target:      Number(form.target),
        saved:       Number(form.saved) || 0,
        months:      Number(form.months) || 12,
        income:      income || undefined,
      };
      const res  = await fetch("http://localhost:5000/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to add goal"); return; }
      if (data.warning) setWarning(data.warning);
      setGoals([data.data, ...goals]);
      if (!data.warning) setShowGoalForm(false);
      else setTimeout(() => setShowGoalForm(false), 2500);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl border p-6 sm:p-8 my-4 ${
        darkMode ? "bg-[#111C44] border-white/10 text-white" : "bg-white border-gray-200 text-black"
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Add Savings Goal</h2>
          <button onClick={() => setShowGoalForm(false)} className={`p-2 rounded-xl transition-all ${darkMode ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500"}`}>
            <X size={20} />
          </button>
        </div>

        {error   && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><AlertTriangle size={16}/>{error}</div>}
        {warning && <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><AlertTriangle size={16}/>{WARNING_MSG[warning] || warning}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category picker */}
          <div>
            <label className="block mb-2 text-sm font-medium">Goal Category</label>
            <div className="grid grid-cols-4 gap-2">
              {GOAL_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, category: c.value }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-2xl border text-xs transition-all duration-200 ${
                    form.category === c.value
                      ? "bg-violet-600 border-violet-500 text-white"
                      : darkMode ? "bg-white/5 border-white/10 text-gray-300 hover:border-violet-500/50" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-400"
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className="leading-tight text-center">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Goal Title</label>
            <input type="text" placeholder="e.g. Child's College Fund" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputCls} required />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Description (optional)</label>
            <input type="text" placeholder="Short description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Target Amount (₹)</label>
              <input type="number" min="1" placeholder="e.g. 500000" value={form.target} onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Timeline (months)</label>
              <input type="number" min="1" max="360" placeholder="12" value={form.months} onChange={(e) => setForm((p) => ({ ...p, months: e.target.value }))} className={inputCls} required />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Already Saved (₹)</label>
            <input type="number" min="0" placeholder="0" value={form.saved} onChange={(e) => setForm((p) => ({ ...p, saved: e.target.value }))} className={inputCls} />
          </div>

          {/* Smart preview */}
          {preview.monthly > 0 && (
            <div className={`rounded-2xl p-4 border ${darkMode ? "bg-violet-500/10 border-violet-500/30" : "bg-violet-50 border-violet-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} className="text-violet-400" />
                <span className="text-sm font-medium text-violet-400">Smart Calculation</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className={darkMode ? "text-gray-400" : "text-gray-500"}>Monthly contribution</p>
                  <p className="font-bold text-violet-400">₹{preview.monthly.toLocaleString()}/mo</p>
                </div>
                <div>
                  <p className={darkMode ? "text-gray-400" : "text-gray-500"}>Target completion</p>
                  <p className="font-bold text-blue-400">{preview.targetDate}</p>
                </div>
              </div>
              {preview.monthly < 1000 && (
                <p className="text-xs text-yellow-400 mt-2">⚠️ Minimum contribution is ₹1,000/month</p>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={() => setShowGoalForm(false)} className={`flex-1 p-4 rounded-2xl font-semibold transition-all ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-gray-200 hover:bg-gray-300"}`}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 p-4 rounded-2xl font-semibold text-white transition-all shadow-lg disabled:opacity-50">
              {loading ? "Adding..." : "Add Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddGoal;
