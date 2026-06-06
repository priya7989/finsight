import { useState, useRef } from "react";
import { User, Mail, Lock, Palette, Eye, EyeOff, Check, Camera, LogOut, Shield, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";

import { useTheme, THEMES } from "../context/ThemeContext";

// ── Reusable input ────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 theme-muted">{label}</label>
      {children}
    </div>
  );
}

function Input({ darkMode, ...props }) {
  return (
    <input
      {...props}
      className={`w-full p-4 rounded-2xl outline-none border transition-all duration-300 theme-input focus:border-[var(--accent)] ${props.className || ""}`}
      style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
    />
  );
}

function SectionCard({ darkMode, title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border p-6 transition-all duration-300" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-glow)" }}>
          <Icon size={18} style={{ color: "var(--accent)" }} />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Theme Picker ──────────────────────────────────────────
function ThemePicker({ darkMode }) {
  const { themeKey, accentColor, switchTheme, updateAccent } = useTheme();
  const { token, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  async function saveToServer(key, accent) {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ theme: key, accentColor: accent || accentColor }),
      });
      const data = await res.json();
      if (res.ok) { updateUser(data.user); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  function handleTheme(key) {
    switchTheme(key);
    saveToServer(key, accentColor);
  }

  function handleAccent(color) {
    updateAccent(color);
    saveToServer(themeKey, color);
  }

  return (
    <SectionCard darkMode={darkMode} title="Theme & Appearance" icon={Palette}>
      <div className="space-y-6">
        {/* Theme grid */}
        <div>
          <p className="text-sm font-medium mb-3 theme-muted">Select Theme</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => handleTheme(key)}
                className={`relative flex flex-col items-start p-3 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  themeKey === key ? "ring-2" : ""
                }`}
                style={{
                  background:   t.vars["--bg-card"],
                  borderColor:  themeKey === key ? t.vars["--accent"] : t.vars["--border"],
                  ringColor:    t.vars["--accent"],
                }}
              >
                {/* Color swatches */}
                <div className="flex gap-1.5 mb-2">
                  {t.preview.map((c, i) => (
                    <div key={i} className="w-4 h-4 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-xs font-medium" style={{ color: t.vars["--text-primary"] }}>{t.label}</span>
                {themeKey === key && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: t.vars["--accent"] }}>
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div>
          <p className="text-sm font-medium mb-3 theme-muted">Custom Accent Color</p>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={accentColor || THEMES[themeKey]?.vars["--accent"] || "#8B5CF6"}
              onChange={(e) => handleAccent(e.target.value)}
              className="w-12 h-12 rounded-xl border cursor-pointer p-1"
              style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}
            />
            <div className="flex gap-2 flex-wrap">
              {["#8B5CF6","#3B82F6","#10B981","#F97316","#F43F5E","#FACC15","#0EA5E9","#EC4899"].map((c) => (
                <button
                  key={c}
                  onClick={() => handleAccent(c)}
                  className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                  style={{ background: c, borderColor: accentColor === c ? "white" : "transparent" }}
                />
              ))}
            </div>
          </div>
        </div>

        {saving && <p className="text-xs theme-muted">Saving...</p>}
        {saved  && <p className="text-xs text-green-400">✓ Theme saved</p>}
      </div>
    </SectionCard>
  );
}

// ── Profile Info ──────────────────────────────────────────
function ProfileInfo({ darkMode }) {
  const { user, token, updateUser } = useAuth();
  const fileRef = useRef(null);
  const [form,    setForm]    = useState({ name: user?.name || "", email: user?.email || "" });
  const [avatar,  setAvatar]  = useState(user?.avatar || "");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState({ type: "", text: "" });

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { setMsg({ type: "error", text: "Image must be under 500KB" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: form.name, email: form.email, avatar }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "error", text: data.error || "Update failed" }); return; }
      updateUser(data.user);
      setMsg({ type: "success", text: "Profile updated successfully" });
    } catch { setMsg({ type: "error", text: "Network error" }); }
    finally { setLoading(false); }
  }

  const initials = (user?.name || "U")[0].toUpperCase();

  return (
    <SectionCard darkMode={darkMode} title="Profile Information" icon={User}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white overflow-hidden"
              style={{ background: avatar ? "transparent" : "var(--accent)" }}
            >
              {avatar
                ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                : initials
              }
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg"
              style={{ background: "var(--accent)" }}
            >
              <Camera size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm theme-muted">{user?.email}</p>
            <p className="text-xs mt-1 capitalize px-2 py-0.5 rounded-full inline-block" style={{ background: "var(--accent-glow)", color: "var(--accent)" }}>
              {user?.role}
            </p>
          </div>
        </div>

        {msg.text && (
          <div className={`text-sm rounded-xl px-4 py-3 ${msg.type === "error" ? "bg-red-500/10 border border-red-500/30 text-red-400" : "bg-green-500/10 border border-green-500/30 text-green-400"}`}>
            {msg.text}
          </div>
        )}

        <Field label="Full Name">
          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Your name" required />
        </Field>

        <Field label="Email Address">
          <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@example.com" required />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-4 rounded-2xl font-semibold text-white transition-all shadow-lg disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </SectionCard>
  );
}

// ── Change Password ───────────────────────────────────────
function ChangePassword({ darkMode }) {
  const { token } = useAuth();
  const [form,    setForm]    = useState({ current: "", next: "", confirm: "" });
  const [show,    setShow]    = useState({ current: false, next: false });
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState({ type: "", text: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (form.next !== form.confirm) { setMsg({ type: "error", text: "New passwords do not match" }); return; }
    if (form.next.length < 6)       { setMsg({ type: "error", text: "Password must be at least 6 characters" }); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "error", text: data.error || "Failed" }); return; }
      setMsg({ type: "success", text: "Password changed successfully" });
      setForm({ current: "", next: "", confirm: "" });
    } catch { setMsg({ type: "error", text: "Network error" }); }
    finally { setLoading(false); }
  }

  const eyeBtn = (key) => (
    <button type="button" onClick={() => setShow((p) => ({ ...p, [key]: !p[key] }))} className="theme-muted hover:text-white transition-colors shrink-0">
      {show[key] ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  const pwdInput = (key, label, placeholder) => (
    <Field label={label}>
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 border" style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
        <Lock size={16} className="theme-muted shrink-0" />
        <input
          type={show[key] ? "text" : "password"}
          value={form[key] || form.confirm}
          onChange={(e) => setForm((p) => ({ ...p, [key === "confirm" ? "confirm" : key]: e.target.value }))}
          placeholder={placeholder}
          className="bg-transparent outline-none w-full text-sm"
          style={{ color: "var(--text-primary)" }}
          required
        />
        {key !== "confirm" && eyeBtn(key)}
      </div>
    </Field>
  );

  return (
    <SectionCard darkMode={darkMode} title="Change Password" icon={Lock}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {msg.text && (
          <div className={`text-sm rounded-xl px-4 py-3 ${msg.type === "error" ? "bg-red-500/10 border border-red-500/30 text-red-400" : "bg-green-500/10 border border-green-500/30 text-green-400"}`}>
            {msg.text}
          </div>
        )}
        <Field label="Current Password">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 border" style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
            <Lock size={16} className="theme-muted shrink-0" />
            <input type={show.current ? "text" : "password"} value={form.current} onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))} placeholder="Current password" className="bg-transparent outline-none w-full text-sm" style={{ color: "var(--text-primary)" }} required />
            {eyeBtn("current")}
          </div>
        </Field>
        <Field label="New Password">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 border" style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
            <Lock size={16} className="theme-muted shrink-0" />
            <input type={show.next ? "text" : "password"} value={form.next} onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))} placeholder="Min. 6 characters" className="bg-transparent outline-none w-full text-sm" style={{ color: "var(--text-primary)" }} required />
            {eyeBtn("next")}
          </div>
        </Field>
        <Field label="Confirm New Password">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3 border" style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
            <Lock size={16} className="theme-muted shrink-0" />
            <input type="password" value={form.confirm} onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" className="bg-transparent outline-none w-full text-sm" style={{ color: "var(--text-primary)" }} required />
          </div>
        </Field>
        <button type="submit" disabled={loading} className="w-full p-4 rounded-2xl font-semibold text-white transition-all shadow-lg disabled:opacity-50" style={{ background: "var(--accent)" }}>
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </SectionCard>
  );
}

// ── Account Info ──────────────────────────────────────────
function AccountInfo({ darkMode }) {
  const { user, logout } = useAuth();

  const info = [
    { label: "Account ID",    val: user?.id?.toString().slice(-8).toUpperCase() || "—" },
    { label: "Role",          val: user?.role === "admin" ? "👑 Family Admin" : "👤 Member" },
    { label: "Member Since",  val: "Active" },
    { label: "Session",       val: "Active — JWT (7 days)" },
  ];

  return (
    <SectionCard darkMode={darkMode} title="Account Details" icon={Shield}>
      <div className="space-y-3 mb-6">
        {info.map((i) => (
          <div key={i.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm theme-muted">{i.label}</span>
            <span className="text-sm font-medium">{i.val}</span>
          </div>
        ))}
      </div>
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl font-semibold transition-all bg-red-500/20 hover:bg-red-500/30 text-red-400"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </SectionCard>
  );
}

// ── Main Page ─────────────────────────────────────────────
function ProfileSettings({ darkMode }) {
  return (
    <div className="mt-8 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ProfileInfo   darkMode={darkMode} />
        <ThemePicker   darkMode={darkMode} />
        <ChangePassword darkMode={darkMode} />
        <AccountInfo   darkMode={darkMode} />
      </div>
    </div>
  );
}

export default ProfileSettings;
