import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/web-daftar.png";
import toast from "react-hot-toast";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Failed to parse user in sidebar", e);
      }
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    toast.success("Tizimdan chiqildi!");
    navigate("/login");
  };

  const navItems = [
    {
      id: "home",
      label: "Bosh sahifa",
      path: "/",
      icon: "fa-home",
    },
    {
      id: "debts",
      label: "Qarzlar ro'yxati",
      path: "/debts",
      icon: "fa-list-ul",
    },
    {
      id: "add-debt",
      label: "Yangi qarz",
      path: "/add-debt",
      icon: "fa-plus-circle",
    },
    {
      id: "diagram",
      label: "Statistika",
      path: "/diagram",
      icon: "fa-chart-line",
    },
    {
      id: "profile",
      label: "Kabinet (Profil)",
      path: "/profile",
      icon: "fa-user-circle",
    },
  ];

  if (!currentUser || currentUser.role === "admin") return null;

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200/80 text-slate-600 z-30 shadow-[4px_0_30px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <img
          src={logo}
          alt="Logo"
          className="w-10 h-10 rounded-xl shadow border border-slate-100 bg-white"
        />
        <div className="min-w-0">
          <h2 className="text-slate-800 font-bold text-sm leading-tight truncate">
            Kiyim Magazini
          </h2>
          <p className="text-slate-400 text-xs font-semibold">
            Qarz Daftar Tizimi
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 text-left cursor-pointer group ${
                isActive
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-bold shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <i
                className={`fas ${item.icon} text-lg transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                }`}
              ></i>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
