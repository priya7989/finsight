import { useState } from "react";
import { ShoppingBag, Utensils, Car, Tv, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";


const getIcon = (cat) => ({ Shopping: ShoppingBag, Food: Utensils, Travel: Car }[cat] || Tv);
const getColor = (cat) => ({ Shopping: "bg-pink-500", Food: "bg-orange-500", Travel: "bg-blue-500" }[cat] || "bg-red-500");

// ── Main ──────────────────────────────────────────────────
function Transactions({ darkMode, transactions, setTransactions }) {
  const { token } = useAuth();

  async function deleteTransaction(id) {
    try {
      await fetch(`${API_URL}/transactions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setTransactions((prev) => prev.filter((t) => t._id !== id));
    } catch (err) { console.error(err); }
  }

  return (
    <div
      className="rounded-2xl border shadow-xl p-6 transition-all duration-300 hover:-translate-y-1"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        <button className="text-sm transition-all duration-300" style={{ color: "var(--accent)" }}>
          View All
        </button>
      </div>

      {/* Empty */}
      {transactions.length === 0 && (
        <div className="text-center py-10 rounded-2xl border theme-muted" style={{ borderColor: "var(--border)" }}>
          No Transactions Yet
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {transactions.map((item) => {
          const Icon = getIcon(item.category);
          return (
            <div
              key={item._id}
              className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {/* Left */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${getColor(item.category)} flex items-center justify-center shadow-lg text-white`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm mt-1 theme-muted">{item.category}</p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3">
                <p className="text-red-400 font-semibold text-sm sm:text-base">- ₹{item.amount}</p>
                <button
                  onClick={() => deleteTransaction(item._id)}
                  className="p-2 rounded-xl transition-all duration-300 theme-muted"
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#F87171"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Transactions;
