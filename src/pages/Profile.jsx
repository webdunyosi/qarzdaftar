import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../assets/web-daftar.png";
import api from "../utils/api";

export default function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [qarzStats, setQarzStats] = useState({ total: 0, paid: 0, overdue: 0 });

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }
    const loggedUser = JSON.parse(userStr);
    setCurrentUser(loggedUser);

    const loadProfileData = async () => {
      const logsRes = await api.get("/logs");
      if (!logsRes.error) {
        setLogs(logsRes);
      }

      const debtsRes = await api.get("/debts");
      if (!debtsRes.error) {
        setQarzStats({
          total: debtsRes.length,
          paid: debtsRes.filter((q) => q.status === "To'langan").length,
          overdue: debtsRes.filter(
            (q) => new Date(q.tolashMuddati) < new Date() && q.status !== "To'langan"
          ).length,
        });
      }
    };

    loadProfileData();
  }, [navigate]);

  const clearLogs = async () => {
    const res = await api.delete("/logs");
    if (!res.error) {
      toast.success("Jurnal muvaffaqiyatli tozalandi!");
      setLogs([]);
    } else {
      toast.error(res.error);
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "add": return { icon: "fa-plus-circle", bg: "bg-green-100 text-green-600" };
      case "edit": return { icon: "fa-edit", bg: "bg-yellow-100 text-yellow-600" };
      case "delete": return { icon: "fa-trash", bg: "bg-red-100 text-red-600" };
      case "pay": return { icon: "fa-check-circle", bg: "bg-blue-100 text-blue-600" };
      default: return { icon: "fa-info-circle", bg: "bg-gray-100 text-gray-600" };
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    toast.success("Tizimdan chiqildi!");
    navigate("/login");
  };

  const menuItems = [
    {
      icon: "fa-chart-line",
      label: "Diagramma va statistika",
      sublabel: "Haftalik qarzlar grafigi",
      iconBg: "bg-indigo-100 text-indigo-600",
      action: () => navigate("/diagram"),
    },
    {
      icon: "fa-list-ul",
      label: "Qarzlar ro'yxati",
      sublabel: "Barcha qarzlarni ko'rish",
      iconBg: "bg-blue-100 text-blue-600",
      action: () => navigate("/debts"),
    },
    {
      icon: "fa-plus-circle",
      label: "Yangi qarz qo'shish",
      sublabel: "Mijoz qarzini kiritish",
      iconBg: "bg-green-100 text-green-600",
      action: () => navigate("/add-debt"),
    },
    {
      icon: "fa-bell",
      label: "Bildirishnomalar",
      sublabel: `${logs.length} ta faoliyat logi`,
      iconBg: "bg-yellow-100 text-yellow-600",
      action: () => {},
    },
  ];

  return (
    <div>
      <div className="main-background" />

      <div className="min-h-screen pb-24">



        <div className="px-4 pt-2 space-y-4">

          {/* User Card */}
          <div className="glass-card-premium hover-shadow-blue rounded-3xl p-6 flex items-center gap-4 animate-slide-up">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(37,99,235,0.25)] border-2 border-white">
                <i className="fas fa-user-tie text-3xl text-white"></i>
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow"></span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-slate-800 font-extrabold text-xl capitalize truncate">
                {currentUser?.username || "Mehmon"}
              </h2>
              <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mt-0.5">
                {currentUser?.role === "admin" ? "Tizim Administratori" : "Operator / Foydalanuvchi"}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-blue-600">
                <i className="fas fa-shield-alt text-[9px]"></i>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {currentUser?.role || "user"}
                </span>
              </div>
            </div>
            <img src={logo} alt="Logo" className="w-12 h-12 rounded-xl flex-shrink-0 shadow border border-slate-100 bg-white" />
          </div>



          {/* Menu Items */}
          <div className="glass-card-premium hover-shadow-blue rounded-3xl p-2 animate-slide-up">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-slate-50/80 hover:pl-6 active:bg-blue-50 transition-all duration-300 cursor-pointer text-left border-b border-slate-100/60 last:border-b-0 group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110`}>
                    <i className={`fas ${item.icon} text-base`}></i>
                  </div>
                  <div>
                    <p className="text-slate-700 font-semibold text-sm transition-colors duration-200 group-hover:text-blue-600">{item.label}</p>
                    {item.desc && <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>}
                  </div>
                </div>
                <i className="fas fa-chevron-right text-slate-300 text-xs flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-500"></i>
              </button>
            ))}
          </div>

          {/* Notifications Section */}
          <div className="glass-card-premium hover-shadow-blue rounded-3xl p-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-amber-50 border border-amber-100 text-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-bell text-base"></i>
                </div>
                <div>
                  <p className="text-slate-800 font-bold text-sm">Bildirishnomalar</p>
                  <p className="text-slate-400 text-xs">{logs.length} ta faoliyat</p>
                </div>
              </div>
              {logs.length > 0 && (
                <button
                  onClick={clearLogs}
                  className="text-xs text-rose-500 font-bold hover:text-rose-600 transition"
                >
                  Tozalash
                </button>
              )}
            </div>
            {logs.length === 0 ? (
              <div className="text-center py-8 px-4">
                <i className="fas fa-bell-slash text-2xl text-slate-300 mb-2"></i>
                <p className="text-slate-400 text-sm">Bildirishnomalar mavjud emas</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {[...logs].reverse().slice(0, 6).map((log) => {
                  const ic = getLogIcon(log.type);
                  return (
                    <div key={log.id} className="flex items-center gap-3 py-3 border-b last:border-b-0 border-slate-100/60 hover:bg-slate-50/40 px-2 rounded-xl transition duration-150">
                      <div className={`w-8 h-8 ${ic.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <i className={`fas ${ic.icon} text-xs`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-sm truncate font-medium">{log.text}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{log.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 hover:shadow-red-500/25 text-white font-extrabold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_4px_15px_rgba(239,68,68,0.25)] hover:shadow-lg active:scale-95 cursor-pointer animate-slide-up"
          >
            <i className="fas fa-sign-out-alt text-lg"></i>
            Tizimdan chiqish
          </button>

        </div>
      </div>
    </div>
  );
}
