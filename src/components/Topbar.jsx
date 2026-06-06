import { Bell, Search, Palette } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";

import { useTheme, THEMES } from "../context/ThemeContext";
import { useState } from "react";

function ThemeQuickPicker({ onClose }) {
  const { themeKey, switchTheme, token } = useTheme();
  const { token: authToken, updateUser } = useAuth();

  async function handlePick(key) {
    switchTheme(key);
    onClose();
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ theme: key }),
      });
      if (res.ok) { const d = await res.json(); updateUser(d.user); }
    } catch { /* silent */ }
  }

  return (
    <div
      className="absolute top-full right-0 mt-2 z-50 rounded-2xl border shadow-2xl p-3 w-64"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <p className="text-xs font-semibold mb-3 px-1 theme-muted">Quick Theme Switch</p>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(THEMES).map(([key, t]) => (
          <button
            key={key}
            onClick={() => handlePick(key)}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all hover:scale-105"
            style={{
              background:  t.vars["--bg-card"],
              borderColor: themeKey === key ? t.vars["--accent"] : t.vars["--border"],
            }}
          >
            <div className="flex gap-1">
              {t.preview.map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <span className="text-xs leading-tight text-center" style={{ color: t.vars["--text-muted"] }}>
              {t.label.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Topbar({ darkMode }) {
  const { user } = useAuth();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const initials = (user?.name || "U")[0].toUpperCase();

  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

      {/* Left */}
      <div>
        <h1 className="text-4xl font-bold">
          Welcome back, {user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="theme-muted mt-2">{formattedDate}</p>
      </div>

      {/* Right */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">

        {/* Search */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 w-full sm:w-[280px] border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <Search size={18} className="theme-muted shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none w-full text-sm"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        {/* Theme picker button */}
        <div className="relative">
          <button
            onClick={() => setShowThemePicker((v) => !v)}
            className="w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 hover:opacity-80"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--accent)" }}
            title="Switch theme"
          >
            <Palette size={20} />
          </button>
          {showThemePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowThemePicker(false)} />
              <ThemeQuickPicker onClose={() => setShowThemePicker(false)} />
            </>
          )}
        </div>

        {/* Notification */}
        <button
          className="w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 hover:opacity-80"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <Bell size={22} />
        </button>

        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white overflow-hidden shrink-0"
          style={{ background: user?.avatar ? "transparent" : "var(--accent)" }}
        >
          {user?.avatar
            ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            : initials
          }
        </div>

      </div>
    </div>
  );
}

export default Topbar;
