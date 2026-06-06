import { useState, useEffect } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { Heart, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";

const COLORS = ["#8B5CF6", "#3B82F6", "#F59E0B", "#EF4444", "#10B981", "#EC4899"];
const CAT_COLORS = { Food: "#F59E0B", Travel: "#3B82F6", Shopping: "#EC4899", Entertainment: "#EF4444", Other: "#10B981" };
const getCatColor = (name, i) => CAT_COLORS[name] || COLORS[i % COLORS.length];

const CATEGORY_ICONS = {
  "Education": "🎓", "Child Future": "👶", "Emergency": "🚨",
  "Home": "🏠", "Vehicle": "🚗", "Retirement": "🌅", "Medical": "🏥", "Personal": "✨",
};

const STATUS_COLORS = {
  Excellent: { bg: "bg-green-500/20",  text: "text-green-400",  border: "border-green-500/30",  hex: "#10B981" },
  Stable:    { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/30", hex: "#8B5CF6" },
  Risky:     { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30", hex: "#F59E0B" },
  Critical:  { bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/30",    hex: "#EF4444" },
};

function TabBtn({ active, onClick, children, darkMode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
      active ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
             : darkMode ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}>{children}</button>
  );
}

function ChartCard({ darkMode, title, subtitle, children }) {
  return (
    <div className={`rounded-2xl border shadow-xl p-6 transition-all duration-300 ${
      darkMode ? "bg-gradient-to-br from-[#111C44] to-[#0B1739] border-white/10 text-white" : "bg-white border-gray-200 text-black"
    }`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Financial Health Card ─────────────────────────────────
function HealthCard({ health, darkMode }) {
  if (!health) return null;
  const sc = STATUS_COLORS[health.status] || STATUS_COLORS.Stable;

  // Score arc — simple SVG
  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const dash   = (health.score / 100) * circ;

  return (
    <div className={`rounded-2xl border shadow-xl p-6 ${darkMode ? "bg-gradient-to-br from-[#111C44] to-[#0B1739] border-white/10 text-white" : "bg-white border-gray-200 text-black"}`}>
      <div className="flex items-center gap-2 mb-5">
        <Heart size={18} className="text-violet-400" />
        <h3 className="text-lg font-semibold">Financial Health</h3>
        <span className={`ml-auto text-xs px-3 py-1 rounded-full border font-semibold ${sc.bg} ${sc.text} ${sc.border}`}>
          {health.status}
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Arc gauge */}
        <div className="relative shrink-0 w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={radius} fill="none" stroke={darkMode ? "rgba(255,255,255,0.07)" : "#f0f0f0"} strokeWidth="12" />
            <circle
              cx="64" cy="64" r={radius}
              fill="none"
              stroke={sc.hex}
              strokeWidth="12"
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              transform="rotate(-90 64 64)"
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: sc.hex }}>{health.score}</span>
            <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>/100</span>
          </div>
        </div>

        {/* Checks */}
        <div className="flex-1 space-y-2 min-w-0">
          {(health.checks || []).slice(0, 5).map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              {c.ok
                ? <CheckCircle size={13} className="text-green-400 mt-0.5 shrink-0" />
                : <AlertTriangle size={13} className={`mt-0.5 shrink-0 ${c.impact === "critical" ? "text-red-400" : c.impact === "high" ? "text-orange-400" : "text-yellow-400"}`} />
              }
              <span className={`text-xs leading-tight ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          { label: "Expense Ratio", val: `${Math.round((health.expenseRatio || 0) * 100)}%`, color: (health.expenseRatio || 0) > 0.8 ? "text-red-400" : "text-green-400" },
          { label: "Savings Rate",  val: `${Math.round((health.savingsRate  || 0) * 100)}%`, color: (health.savingsRate  || 0) > 0.1 ? "text-green-400" : "text-yellow-400" },
          { label: "Balance",       val: health.balance >= 0 ? "Positive" : "Negative",      color: health.balance >= 0 ? "text-green-400" : "text-red-400" },
        ].map((m) => (
          <div key={m.label} className={`rounded-xl p-3 text-center ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{m.label}</p>
            <p className={`text-sm font-bold mt-0.5 ${m.color}`}>{m.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Financial Flow Card ───────────────────────────────────
function FinancialFlowCard({ flow, darkMode }) {
  if (!flow || !flow.income) return null;
  const { income, expenses, goalSavings, balance } = flow;
  const total = income || 1;

  const bars = [
    { label: "Income",       val: income,      pct: 100,                              color: "bg-green-500",  hex: "#10B981" },
    { label: "Expenses",     val: expenses,    pct: Math.min((expenses / total) * 100, 100),     color: "bg-red-500",    hex: "#EF4444" },
    { label: "Goal Savings", val: goalSavings, pct: Math.min((goalSavings / total) * 100, 100),  color: "bg-violet-500", hex: "#8B5CF6" },
    { label: "Balance",      val: balance,     pct: Math.min(Math.max((balance / total) * 100, 0), 100), color: balance >= 0 ? "bg-blue-500" : "bg-orange-500", hex: balance >= 0 ? "#3B82F6" : "#F97316" },
  ];

  return (
    <div className={`rounded-2xl border shadow-xl p-6 ${darkMode ? "bg-gradient-to-br from-[#111C44] to-[#0B1739] border-white/10 text-white" : "bg-white border-gray-200 text-black"}`}>
      <div className="flex items-center gap-2 mb-5">
        <Zap size={18} className="text-violet-400" />
        <h3 className="text-lg font-semibold">Financial Flow</h3>
        <span className={`ml-auto text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Income → Expenses → Goals → Balance</span>
      </div>

      <div className="space-y-4">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{b.label}</span>
              <span className="text-sm font-bold" style={{ color: b.hex }}>
                {b.val < 0 ? "-" : ""}₹{Math.abs(b.val).toLocaleString("en-IN")}
              </span>
            </div>
            <div className={`h-3 w-full rounded-full overflow-hidden ${darkMode ? "bg-white/10" : "bg-gray-100"}`}>
              <div
                className={`h-full rounded-full transition-all duration-700 ${b.color}`}
                style={{ width: `${b.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {balance < 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          <AlertTriangle size={12} />
          Expenses + goal contributions exceed income. Consider reducing goals or expenses.
        </div>
      )}
    </div>
  );
}

// ── Main Analytics Page ───────────────────────────────────
function Analytics({ darkMode, income = 0 }) {
  const { token } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("monthly");

  useEffect(() => {
    const url = `http://localhost:5000/analytics/user${income > 0 ? `?income=${income}` : ""}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, income]);

  const tooltipStyle = {
    contentStyle: {
      background: darkMode ? "#111C44" : "#fff",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      color: darkMode ? "#fff" : "#000",
    },
  };

  const tickStyle = { fill: darkMode ? "#9CA3AF" : "#6B7280", fontSize: 11 };
  const gridStroke = darkMode ? "rgba(255,255,255,0.05)" : "#f0f0f0";
  const fmtY = (v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <p className={`text-center py-10 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No analytics data yet.</p>
  );

  const totalSpent   = data.byCategory.reduce((s, c) => s + c.value, 0);
  const activeGoals  = (data.goals || []).filter((g) => g.status !== "completed").length;
  const completedGoals = (data.goals || []).filter((g) => g.status === "completed").length;

  // Build chart data depending on tab
  // For daily: use category-stacked bar; for weekly/monthly: area chart
  const allCats = [...new Set((data.daily || []).flatMap((d) => (d.categories || []).map((c) => c.name)))];

  const dailyChartData = (data.daily || []).map((d) => {
    const row = { name: d.date.slice(5), total: d.amount, count: d.count, _raw: d };
    (d.categories || []).forEach((c) => { row[c.name] = c.amount; });
    return row;
  });

  const weeklyChartData = (data.weekly || []).map((d) => ({ name: d.week, amount: d.amount }));
  const monthlyChartData = (data.monthly || []).map((d) => ({ name: d.month, amount: d.amount }));

  return (
    <div className="mt-8 space-y-6">

      {/* Header */}
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
          { label: "Total Spent",      val: `₹${totalSpent.toLocaleString("en-IN")}`,  color: "text-red-400",    icon: TrendingDown },
          { label: "Active Goals",     val: activeGoals,                                color: "text-violet-400", icon: Target       },
          { label: "Goals Completed",  val: completedGoals,                             color: "text-green-400",  icon: CheckCircle  },
          { label: "Health Score",     val: data.health?.score ?? "—",                  color: data.health?.score >= 65 ? "text-green-400" : data.health?.score >= 45 ? "text-yellow-400" : "text-red-400", icon: Heart },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-2xl border p-4 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={s.color} />
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{s.label}</p>
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
            </div>
          );
        })}
      </div>

      {/* Health + Financial Flow */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <HealthCard health={data.health} darkMode={darkMode} />
        <FinancialFlowCard flow={data.financialFlow} darkMode={darkMode} />
      </div>

      {/* Time-series chart — daily stacked by category, weekly/monthly area */}
      <ChartCard
        darkMode={darkMode}
        title={tab === "daily" ? "Daily Spending — Category Breakdown (Last 30 Days)" : tab === "weekly" ? "Weekly Spending (Last 8 Weeks)" : "Monthly Spending (Last 6 Months)"}
        subtitle={tab === "daily" ? "Hover a bar to see category breakdown" : "Tap a point for details"}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {tab === "daily" ? (
              <BarChart data={dailyChartData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" tick={tickStyle} />
                <YAxis tick={tickStyle} tickFormatter={fmtY} />
                <Tooltip
                  {...tooltipStyle}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const raw = payload[0]?.payload?._raw;
                    return (
                      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 14px", minWidth: 180 }}>
                        <p style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 6 }}>{label}</p>
                        <p style={{ color: "#EF4444", fontSize: 12, marginBottom: 4 }}>
                          Total: ₹{(raw?.amount || 0).toLocaleString("en-IN")} · {raw?.count || 0} txn{raw?.count !== 1 ? "s" : ""}
                        </p>
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
                <Legend wrapperStyle={{ fontSize: 11, color: darkMode ? "#9CA3AF" : "#6B7280" }} />
                {allCats.length > 0
                  ? allCats.map((cat, i) => (
                      <Bar key={cat} dataKey={cat} stackId="a" fill={getCatColor(cat, i)} radius={i === allCats.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                    ))
                  : <Bar dataKey="total" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                }
              </BarChart>
            ) : (
              <AreaChart data={tab === "weekly" ? weeklyChartData : monthlyChartData}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" tick={tickStyle} />
                <YAxis tick={tickStyle} tickFormatter={fmtY} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, "Spent"]} />
                <Area type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={2} fill="url(#spendGrad)" dot={{ fill: "#8B5CF6", r: 3 }} activeDot={{ r: 6 }} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Expense vs Savings stacked chart */}
      {data.expenseVsSavings && data.expenseVsSavings.length > 0 && (
        <ChartCard darkMode={darkMode} title="Expense vs Savings vs Goals" subtitle="Monthly breakdown of where your money goes">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.expenseVsSavings}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="month" tick={tickStyle} />
                <YAxis tick={tickStyle} tickFormatter={fmtY} />
                <Tooltip {...tooltipStyle} formatter={(v, n) => [`₹${v.toLocaleString()}`, n]} />
                <Legend wrapperStyle={{ fontSize: 11, color: darkMode ? "#9CA3AF" : "#6B7280" }} />
                <Bar dataKey="expense" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="goals"   name="Goal Savings" fill="#8B5CF6" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="savings" name="Remaining" fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly bar */}
        <ChartCard darkMode={darkMode} title="Monthly Comparison">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly.map((d) => ({ name: d.month, amount: d.amount }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" tick={tickStyle} />
                <YAxis tick={tickStyle} tickFormatter={fmtY} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, "Spent"]} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {data.monthly.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
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
                {data.byCategory.map((c, i) => {
                  const pct = totalSpent > 0 ? ((c.value / totalSpent) * 100).toFixed(1) : 0;
                  return (
                    <div key={c.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm truncate">{c.name}</span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-sm font-semibold">₹{c.value.toLocaleString()}</span>
                        <span className={`text-xs ml-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Goal progress tracker */}
      {data.goals && data.goals.length > 0 && (
        <ChartCard darkMode={darkMode} title="Goal Progress Tracker" subtitle="Track all your savings goals in one place">
          <div className="space-y-5">
            {data.goals.map((g) => {
              const monthsLeft = g.targetDate
                ? Math.max(Math.ceil((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30)), 0)
                : null;

              return (
                <div key={g._id || g.title}>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{CATEGORY_ICONS[g.category] || "✨"}</span>
                      <span className="text-sm font-semibold">{g.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                        g.status === "completed" ? "bg-green-500/20 text-green-400"
                        : g.status === "on-track" ? "bg-blue-500/20 text-blue-400"
                        : g.status === "paused"   ? "bg-gray-500/20 text-gray-400"
                        : "bg-yellow-500/20 text-yellow-400"
                      }`}>{g.status}</span>
                      {g.warningStatus && g.warningStatus !== "none" && (
                        <span className="text-xs text-orange-400 flex items-center gap-1">
                          <AlertTriangle size={10} /> {g.warningStatus}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm shrink-0">
                      <span className={darkMode ? "text-gray-400" : "text-gray-500"}>
                        ₹{g.saved.toLocaleString()} / ₹{g.target.toLocaleString()}
                      </span>
                      <span className="font-bold text-violet-400">{g.pct}%</span>
                    </div>
                  </div>

                  <div className={`h-2.5 w-full rounded-full overflow-hidden ${darkMode ? "bg-white/10" : "bg-gray-200"}`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-700"
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-3">
                      {g.monthlyMin > 0 && g.status !== "completed" && (
                        <span className={`text-xs flex items-center gap-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                          <TrendingUp size={10} /> ₹{g.monthlyMin.toLocaleString()}/mo
                        </span>
                      )}
                      {monthsLeft !== null && g.status !== "completed" && (
                        <span className={`text-xs flex items-center gap-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                          <Clock size={10} /> {monthsLeft} months left
                        </span>
                      )}
                    </div>
                    {g.targetDate && g.status !== "completed" && (
                      <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        📅 {new Date(g.targetDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </span>
                    )}
                    {g.status === "completed" && (
                      <span className="text-xs text-green-400 font-medium">🎉 Completed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      )}

      {/* Smart insights */}
      {data.health && (
        <div className={`rounded-2xl border p-6 ${darkMode ? "bg-gradient-to-br from-[#111C44] to-[#0B1739] border-white/10" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-violet-400" />
            <h3 className="text-lg font-semibold">Smart Insights</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(data.health.checks || []).map((c, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                c.ok
                  ? darkMode ? "bg-green-500/5 border-green-500/20" : "bg-green-50 border-green-200"
                  : c.impact === "critical" ? darkMode ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
                  : c.impact === "high"     ? darkMode ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50 border-orange-200"
                  : darkMode ? "bg-yellow-500/5 border-yellow-500/20" : "bg-yellow-50 border-yellow-200"
              }`}>
                <span className="text-base mt-0.5 shrink-0">
                  {c.ok ? "✅" : c.impact === "critical" ? "🚨" : c.impact === "high" ? "⚠️" : "💡"}
                </span>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;
