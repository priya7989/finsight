import { useState, useEffect, useMemo } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import ExpenseChart from "../components/ExpenseChart";
import Transactions from "../components/Transactions";
import BudgetPlanner from "../components/BudgetPlanner";
import SavingsGoal from "../components/SavingsGoal";
import AddTransaction from "../components/AddTransaction";
import Analytics from "./Analytics";
import AdminDashboard from "./AdminDashboard";
import ProfileSettings from "./ProfileSettings";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";


import {
  Wallet,
  ArrowDownCircle,
  PiggyBank,
  Landmark,
  X,
} from "lucide-react";

// ── Income Modal ──────────────────────────────────────────
function IncomeModal({ darkMode, current, onClose, onSave }) {
  const [val, setVal] = useState(current > 0 ? String(current) : "");

  function handleSubmit(e) {
    e.preventDefault();
    const n = Number(val);
    if (!isNaN(n) && n >= 0) onSave(n);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-sm rounded-3xl shadow-2xl border p-6 sm:p-8 transition-all duration-300"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Set Monthly Income</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all theme-muted hover:opacity-80"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 theme-muted">Income Amount (₹)</label>
            <input
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="e.g. 50000"
              autoFocus
              className="w-full p-4 rounded-2xl outline-none border transition-all duration-300"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              required
            />
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-4 rounded-2xl font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 p-4 rounded-2xl font-semibold text-white transition-all shadow-lg"
              style={{ background: "var(--accent)" }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────
function Dashboard({ darkMode }) {
  const { token } = useAuth();

  const [activePage, setActivePage] = useState("dashboard");
  const [showForm, setShowForm]     = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals]           = useState([]);
  const [showIncomeModal, setShowIncomeModal] = useState(false);

  // Income persisted in localStorage
  const [income, setIncome] = useState(() => {
    const saved = localStorage.getItem("finsight_income");
    return saved ? Number(saved) : 0;
  });

  function handleSaveIncome(val) {
    setIncome(val);
    localStorage.setItem("finsight_income", String(val));
    setShowIncomeModal(false);
  }

  // Fetch Transactions
  useEffect(() => {
    fetch(`${API_URL}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setTransactions(data))
      .catch(console.error);
  }, [token]);

  // Fetch Goals
  useEffect(() => {
    fetch(`${API_URL}/goals`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setGoals(data))
      .catch(console.error);
  }, [token]);

  // ── Computed stats ──────────────────────────────────────
  const stats = useMemo(() => {
    const expenses = transactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );
    // Monthly goal savings = sum of all active goal monthly contributions
    const monthlyGoalSavings = goals
      .filter((g) => g.status !== "completed" && g.autoSaveEnabled !== false)
      .reduce((sum, g) => sum + (g.monthlyMin || 0), 0);

    // Savings card = separate future reserve (goal savings pool)
    const savings = monthlyGoalSavings;

    // Balance = income - expenses - monthly goal savings
    const balance = income - expenses - monthlyGoalSavings;

    return { expenses, savings, balance, monthlyGoalSavings };
  }, [transactions, income, goals]);

  const fmt = (n) =>
    "₹" + Math.abs(n).toLocaleString("en-IN");

  // ── Shared layout ───────────────────────────────────────
  return (
    <div
      className="min-h-screen md:flex transition-all duration-500"
      style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      <Sidebar
        darkMode={darkMode}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <div className="flex-1 p-4 sm:p-6 xl:p-8 relative overflow-hidden">
        <Topbar darkMode={darkMode} />

        {/* Glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] blur-[120px] rounded-full pointer-events-none" style={{ background: "var(--glow-color)" }} />

        {/* ── DASHBOARD ── */}
        {activePage === "dashboard" && (
          <>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="bg-violet-600 hover:bg-violet-700 px-5 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
              >
                + Add Transaction
              </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
              <StatCard
                darkMode={darkMode}
                title="Total Income"
                amount={fmt(income)}
                color="bg-green-500"
                icon={Wallet}
                onEdit={() => setShowIncomeModal(true)}
                subtitle={income === 0 ? "Click ✏️ to set income" : "Monthly income"}
              />
              <StatCard
                darkMode={darkMode}
                title="Total Expenses"
                amount={fmt(stats.expenses)}
                color="bg-red-500"
                icon={ArrowDownCircle}
                subtitle={`${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`}
              />
              <StatCard
                darkMode={darkMode}
                title="Savings Reserve"
                amount={fmt(stats.savings)}
                color="bg-blue-500"
                icon={PiggyBank}
                subtitle={
                  stats.monthlyGoalSavings > 0
                    ? `₹${stats.monthlyGoalSavings.toLocaleString("en-IN")}/mo to goals`
                    : "Set goals to track"
                }
              />
              <StatCard
                darkMode={darkMode}
                title="Balance"
                amount={fmt(stats.balance)}
                color={stats.balance >= 0 ? "bg-purple-500" : "bg-orange-500"}
                icon={Landmark}
                subtitle={stats.balance < 0 ? "⚠️ Over budget" : "Income − Expenses − Goals"}
              />
            </div>

            {/* Components grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
              <ExpenseChart darkMode={darkMode} transactions={transactions} />
              <Transactions
                darkMode={darkMode}
                transactions={transactions}
                setTransactions={setTransactions}
              />
              <BudgetPlanner
                darkMode={darkMode}
                transactions={transactions}
                income={income}
              />
              <SavingsGoal darkMode={darkMode} goals={goals} setGoals={setGoals} income={income} />
            </div>
          </>
        )}

        {/* ── TRANSACTIONS ── */}
        {activePage === "transactions" && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Transactions</h1>
              <button
                onClick={() => setShowForm(true)}
                className="bg-violet-600 hover:bg-violet-700 px-5 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                + Add Transaction
              </button>
            </div>

            {/* Mini stat strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Income",   val: fmt(income),         color: "text-green-400" },
                { label: "Expenses", val: fmt(stats.expenses), color: "text-red-400"   },
                { label: "Savings",  val: fmt(stats.savings),  color: "text-blue-400"  },
                { label: "Balance",  val: fmt(stats.balance),  color: stats.balance >= 0 ? "text-violet-400" : "text-orange-400" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border p-4"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                >
                  <p className="text-xs theme-muted">{s.label}</p>
                  <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.val}</p>
                </div>
              ))}
            </div>

            <Transactions
              darkMode={darkMode}
              transactions={transactions}
              setTransactions={setTransactions}
            />
          </div>
        )}

        {/* ── GOALS ── */}
        {activePage === "goals" && (
          <div className="mt-8">
            <h1 className="text-3xl font-bold mb-6">Savings Goals</h1>
            <SavingsGoal darkMode={darkMode} goals={goals} setGoals={setGoals} income={income} />
          </div>
        )}

        {/* ── BUDGET ── */}
        {activePage === "budget" && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Budget Planner</h1>
              <button
                onClick={() => setShowIncomeModal(true)}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              >
                Income: {fmt(income)} ✏️
              </button>
            </div>
            <BudgetPlanner
              darkMode={darkMode}
              transactions={transactions}
              income={income}
            />
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {activePage === "analytics" && <Analytics darkMode={darkMode} income={income} />}

        {/* ── FAMILY (admin only) ── */}
        {activePage === "family" && <AdminDashboard darkMode={darkMode} />}

        {/* ── SETTINGS ── */}
        {activePage === "settings" && <ProfileSettings darkMode={darkMode} />}

        {/* Add Transaction Modal */}
        {showForm && (
          <AddTransaction
            darkMode={darkMode}
            setShowForm={setShowForm}
            transactions={transactions}
            setTransactions={setTransactions}
          />
        )}

        {/* Income Modal */}
        {showIncomeModal && (
          <IncomeModal
            darkMode={darkMode}
            current={income}
            onClose={() => setShowIncomeModal(false)}
            onSave={handleSaveIncome}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
