import {
  LayoutDashboard,
  Wallet,
  Target,
  Settings,
  LogOut,
  User,
  BarChart2,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Sidebar({ darkMode, activePage, setActivePage }) {
  const { user, logout, isAdmin } = useAuth();

  const menuItems = [
    { title: "Dashboard",    icon: LayoutDashboard, key: "dashboard"    },
    { title: "Transactions", icon: Wallet,           key: "transactions" },
    { title: "Goals",        icon: Target,           key: "goals"        },
    { title: "Budget",       icon: Settings,         key: "budget"       },
    { title: "Analytics",    icon: BarChart2,        key: "analytics"    },
    ...(isAdmin ? [
      { title: "Family",     icon: Users,            key: "family"       },
    ] : []),
  ];

  return (
    <div className={`hidden md:flex md:w-72 min-h-screen border-r border-white/10 flex-col justify-between p-6 transition-all duration-500 ${
      darkMode ? "bg-[#0B1739] text-white" : "bg-white text-black"
    }`}>
      {/* Top */}
      <div>
        {/* Logo */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            FinSight
          </h1>
          <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Smart Finance Tracker
          </p>
          {isAdmin && (
            <div className="flex items-center gap-1 mt-2">
              <ShieldCheck size={14} className="text-violet-400" />
              <span className="text-xs text-violet-400 font-medium">Admin</span>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon     = item.icon;
            const isActive = activePage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActivePage(item.key)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                    : darkMode
                    ? "hover:bg-white/10 text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Icon size={22} />
                <span className="font-medium">{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom */}
      <div>
        {/* Profile Card */}
        <div className={`border rounded-2xl p-4 mb-4 transition-all duration-300 ${
          darkMode ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center text-white">
              <User size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{user?.name || "User"}</h3>
              <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 p-4 rounded-2xl transition-all duration-300"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
