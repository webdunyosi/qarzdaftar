import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../assets/web-daftar.png";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active tab from URL params, default is "sellers"
  const activeTab = searchParams.get("tab") || "sellers";

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (userStr) {
      try {
        const loggedUser = JSON.parse(userStr);
        if (loggedUser.role === "admin") {
          setCurrentUser(loggedUser);
        } else {
          navigate("/");
        }
      } catch (e) {
        console.error("Failed to parse user in AdminLayout", e);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    toast.success("Tizimdan chiqildi!");
    navigate("/login");
  };

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const menuItems = [
    { id: "sellers", label: "Sotuvchilar", icon: "fa-users" },
    { id: "all_debts", label: "Barcha Qarzlar", icon: "fa-list-alt" },
    { id: "notifications", label: "Xabar Yuborish", icon: "fa-bullhorn" },
    { id: "settings", label: "Profil Sozlamalari", icon: "fa-user-cog" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      
      {/* 1. Desktop Sidebar */}
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
              Admin Panel
            </h2>
            <p className="text-slate-400 text-xs font-semibold">
              Qarz Daftar Nazorati
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
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

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] mb-3">
            <div className="w-10 h-10 bg-blue-600/90 rounded-xl flex items-center justify-center text-white shadow-md">
              <i className="fas fa-user-shield text-lg"></i>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-800 font-bold text-sm truncate capitalize">
                @{currentUser?.username || "Admin"}
              </p>
              <p className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                Super Admin
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl font-bold text-xs transition-all duration-200 border border-red-100 active:scale-95 cursor-pointer"
          >
            <i className="fas fa-sign-out-alt"></i>
            Tizimdan chiqish
          </button>
        </div>
      </aside>



      {/* 3. Main Content Container */}
      <div className="flex-1 md:pl-64 min-h-screen w-full flex flex-col pb-20 md:pb-0">
        <main className="flex-1 w-full bg-slate-50">
          <Outlet />
        </main>
      </div>

      {/* 4. Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/80 backdrop-blur-xl px-2 flex justify-between items-center h-16 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 transition-all duration-200 cursor-pointer ${
                isActive ? "text-blue-600 scale-105 font-bold" : "text-slate-400 hover:text-blue-600"
              }`}
            >
              <i className={`fas ${item.icon} text-lg mb-0.5`}></i>
              <span className="text-[9px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
