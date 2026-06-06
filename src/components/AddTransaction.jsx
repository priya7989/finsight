import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";


const CATEGORIES = ["Shopping", "Food", "Travel", "Entertainment"];

function AddTransaction({ darkMode, setShowForm, transactions, setTransactions }) {
  const { token } = useAuth();
  const [title,    setTitle]    = useState("");
  const [amount,   setAmount]   = useState("");
  const [category, setCategory] = useState("");
  const [loading,  setLoading]  = useState(false);

  const inputStyle = {
    background:   "var(--bg-input)",
    borderColor:  "var(--border)",
    color:        "var(--text-primary)",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, amount, category, source: "manual" }),
      });
      const data = await res.json();
      setTransactions([data.data, ...transactions]);
      setTitle(""); setAmount(""); setCategory("");
      setShowForm(false);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-lg rounded-3xl shadow-2xl border p-6 sm:p-8 transition-all duration-300"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Add Transaction</h2>
          <button
            onClick={() => setShowForm(false)}
            className="p-2 rounded-xl transition-all theme-muted hover:opacity-80"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block mb-2 text-sm font-medium theme-muted">Transaction Title</label>
            <input
              type="text"
              placeholder="Uber Ride"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 rounded-2xl outline-none border transition-all duration-300"
              style={inputStyle}
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block mb-2 text-sm font-medium theme-muted">Amount (₹)</label>
            <input
              type="number"
              placeholder="450"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-4 rounded-2xl outline-none border transition-all duration-300"
              style={inputStyle}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block mb-2 text-sm font-medium theme-muted">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-4 rounded-2xl outline-none border transition-all duration-300"
              style={inputStyle}
              required
            >
              <option value="">Select Category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 p-4 rounded-2xl font-semibold transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 p-4 rounded-2xl font-semibold text-white transition-all duration-300 shadow-lg disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {loading ? "Adding..." : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTransaction;
