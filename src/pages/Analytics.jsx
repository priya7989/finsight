import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { TrendingUp, Calendar, BarChart2, PieChart as PieIcon, Heart, Target } from "lucide-react";

const COLORS = ["#8B5CF6", "#3B82F6", "#F59E0B", "#EF4444", "#10B981", "#EC4899"];

const CATEGORY_ICONS = {
  "Education": "🎓", "Child Future": "👶", "Emergency": "🚨",
  "Home": "🏠", "Vehicle": "🚗", "Retirement": "🌅", "Medical": "🏥", "Personal": "✨",
};

function TabBtn({ active, onClick, children, darkMode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
      active ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
             : darkMode ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}>{children}</button>
  );
}

function ChartCard({ darkMode, title, children }) {
  return (
    <div className={`rounded-2xl border shadow-xl p-6 transition-all duration-300 ${
      darkMode ? "bg-gradient-to-br from-[#111C44] to-[#0B1739] border-white/10 text-white" : "bg-white border-gray-200 text-black"
    }`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function HealthScore({ score, darkMode }) {
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#8B5CF6" : score >= 40 ? "#F59E0B" : "#EF4444";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Attention";
  const data  = [{ name: "score", value: score, fill: color }];

  return (
    <div className={`rounded-2xl border shadow-xl p-6 ${darkMode ? "bg-gradient-to-br from-[#111C44] to-[#0B1739] border-white/10 text-white" : "bg-white border-gray-200 text-black"}`}>
      <div className="flex items-center gap-2 mb-4">
        <Heart size={18} className="text-violet-400" />
        <h3 className="text-lg font-semibold">Financial Health Score</h3>
      </div>
      <div className="flex items-center gap-6">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius={35} outerRadius={60} data={data} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: darkMode ? "rgba(255,255,255,0.05)" : "#f0f0f0" }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-4xl font-bold" style={{ color }}>{score}</p>
          <p className="text-sm font-medium mt-1" style={{ color }}>{label}</p>
          <div className="mt-3 space-y-1">
            {[
              { label: "Savings goals active",  ok: true  },
              { label: "No over-budget warnings", ok: score >= 70 },
              { label: "Consistent spending",    ok: score >= 60 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <span>{item.ok ? "✅" : "⚠️"}</span>
                <span className={darkMode ? "text-gray-400" : "text-gray-500"}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Analytics({ darkMode }) {
  const { token } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("monthly");

  useEffect(() => {
    fetch("http://localhost:5000/analytics/user", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const tooltipStyle = {
    contentStyle: {
      background: darkMode ? "#111C44" : "#fff",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      color: darkMode ? "#fff" : "#000",
    },
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return <p className={`text-center py-10 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No analytics data yet.</p>;

  const totalSpent = data.byCategory.reduce((s, c) => s + c.value, 0);
  const chartData  = tab === "daily"   ? data.daily.map((d) => ({ name: d.date.slice(5), amount: d.amount }))
                   : tab === "weekly"  ? data.weekly.map((d) => ({ name: d.week, amount: d.amount }))
                   : data.monthly.map((d) => ({ name: d.month, amount: d.amount }));

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">My Analytics</h1>
        <div className="flex gap-2">
          <TabBtn active={tab === "daily"}   onClick={() => setTab("daily")}   darkMode={darkMode}>Daily</TabBtn>
          <TabBtn active={tab === "weekly"}  onClick={() => setTab("weekly")}  darkMode={darkMode}>Weekly</TabBtn>
          <TabBtn active={tab === "monthly"} onClick={() => setTab("monthly")} darkMode={darkMode}>Monthly</TabBtn>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Spent",    val: `₹${totalSpent.toLocaleString("en-IN")}`, color: "text-red-400"    },
          { label: "Categories",     val: data.byCategory.length,                   color: "text-violet-400" },
          { label: "Days Tracked",   val: data.daily.length,                        color: "text-blue-400"   },
          { label: "Active Goals",   val: data.goals?.filter((g) => g.status !== "completed").length || 0, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Health score + time chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <HealthScore score={data.healthScore || 60} darkMode={darkMode} />

        <ChartCard darkMode={darkMode} title={tab === "daily" ? "Daily Spending (30d)" : tab === "weekly" ? "Weekly Spending (8w)" : "Monthly Spending (6m)"}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(255,255,255,0.05)" : "#f0f0f0"} />
                <XAxis dataKey="name" tick={{ fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 11 }} />
                <YAxis tick={{ fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, "Spent"]} />
                <Line type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly bar */}
        <ChartCard darkMode={darkMode} title="Monthly Comparison">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly.map((d) => ({ name: d.month, amount: d.amount }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(255,255,255,0.05)" : "#f0f0f0"} />
                <XAxis dataKey="name" tick={{ fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 11 }} />
                <YAxis tick={{ fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, "Spent"]} />
                <Bar dataKey="amount" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Category pie */}
        <ChartCard darkMode={darkMode} title="Spending by Category">
          {data.byCategory.length === 0 ? (
            <p className={`text-center py-10 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No data yet</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.byCategory} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={4}>
                      {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2">
                {data.byCategory.map((c, i) => (
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
          )}
        </ChartCard>
      </div>

      {/* Goal progress */}
      {data.goals && data.goals.length > 0 && (
        <ChartCard darkMode={darkMode} title="Goal Progress Tracker">
          <div className="space-y-4">
            {data.goals.map((g, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{CATEGORY_ICONS[g.category] || "✨"}</span>
                    <span className="text-sm font-medium">{g.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      g.status === "completed" ? "bg-green-500/20 text-green-400"
                      : g.status === "on-track" ? "bg-blue-500/20 text-blue-400"
                      : "bg-yellow-500/20 text-yellow-400"
                    }`}>{g.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={darkMode ? "text-gray-400" : "text-gray-500"}>₹{g.saved.toLocaleString()} / ₹{g.target.toLocaleString()}</span>
                    <span className="font-bold text-violet-400">{g.pct}%</span>
                  </div>
                </div>
                <div className={`h-2 w-full rounded-full overflow-hidden ${darkMode ? "bg-white/10" : "bg-gray-200"}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-700"
                    style={{ width: `${g.pct}%` }}
                  />
                </div>
                {g.targetDate && g.status !== "completed" && (
                  <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Target: {new Date(g.targetDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    {g.monthlyMin > 0 && ` · ₹${g.monthlyMin.toLocaleString()}/mo`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

export default Analytics;
