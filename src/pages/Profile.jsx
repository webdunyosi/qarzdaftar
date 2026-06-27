import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../assets/web-daftar.png";

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

    const savedLogs = JSON.parse(localStorage.getItem("activity_logs")) || [];
    const myLogs = savedLogs.filter(log => !log.seller || log.seller === loggedUser.username);
    setLogs(myLogs);

    const qarzlar = JSON.parse(localStorage.getItem("qarzlar")) || [];
    const myQarzlar = qarzlar.filter(q => (q.seller || "Marjona") === loggedUser.username);
    
    setQarzStats({
      total: myQarzlar.length,
      paid: myQarzlar.filter((q) => q.status === "To'langan").length,
      overdue: myQarzlar.filter(
        (q) => new Date(q.tolashMuddati) < new Date() && q.status !== "To'langan"
      ).length,
    });
  }, [navigate]);

  const clearLogs = () => {
    const allLogs = JSON.parse(localStorage.getItem("activity_logs")) || [];
    const remaining = allLogs.filter(log => log.seller && log.seller !== currentUser?.username);
    localStorage.setItem("activity_logs", JSON.stringify(remaining));
    setLogs([]);
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
      {/* Solid white background */}
      <div className="fixed inset-0 z-[-2]" style={{ backgroundColor: "#ffffff" }} />

      <div className="min-h-screen pb-24">

        {/* Header */}
        <div className="px-4 pt-6 pb-2 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full md:hidden flex items-center justify-center transition active:scale-95 border border-slate-200"
          >
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
          <h1 className="text-slate-800 font-bold text-xl">Shaxsiy Kabinet</h1>
        </div>

        <div className="px-4 pt-2 space-y-4">

          {/* User Card */}
          <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-5 flex items-center gap-4 shadow-md animate-slide-up">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <i className="fas fa-user-tie text-3xl text-white"></i>
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow"></span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-gray-900 font-bold text-xl capitalize truncate">
                {currentUser?.username || "Mehmon"}
              </h2>
              <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider mt-0.5">
                {currentUser?.role === "admin" ? "Tizim Administratori" : "Operator / Foydalanuvchi"}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-600 rounded-full px-3 py-1">
                <i className="fas fa-shield-alt text-[9px] text-white"></i>
                <span className="text-[10px] text-white font-bold uppercase tracking-wider">
                  {currentUser?.role || "user"}
                </span>
              </div>
            </div>
            <img src={logo} alt="Logo" className="w-12 h-12 rounded-xl flex-shrink-0 shadow-md" />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 animate-slide-up">
            <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-4 text-center shadow-md">
              <p className="text-3xl font-black text-blue-600">{qarzStats.total}</p>
              <p className="text-xs text-gray-500 font-semibold mt-1">Jami</p>
            </div>
            <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-4 text-center shadow-md">
              <p className="text-3xl font-black text-green-500">{qarzStats.paid}</p>
              <p className="text-xs text-gray-500 font-semibold mt-1">To'langan</p>
            </div>
            <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-4 text-center shadow-md">
              <p className="text-3xl font-black text-red-500">{qarzStats.overdue}</p>
              <p className="text-xs text-gray-500 font-semibold mt-1">Muddati o'tgan</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl overflow-hidden shadow-md animate-slide-up">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-blue-100/40 active:bg-blue-100/60 transition cursor-pointer text-left border-b border-blue-100/40 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <i className={`fas ${item.icon} text-base`}></i>
                  </div>
                  <div>
                    <p className="text-gray-800 font-semibold text-sm">{item.label}</p>
                    {item.desc && <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>}
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-300 text-xs flex-shrink-0"></i>
              </button>
            ))}
          </div>

          {/* Notifications Section */}
          <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl overflow-hidden shadow-md animate-slide-up">
            <div className="flex items-center justify-between px-4 py-4 border-b border-blue-100/40">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-bell text-base"></i>
                </div>
                <div>
                  <p className="text-gray-800 font-semibold text-sm">Bildirishnomalar</p>
                  <p className="text-gray-400 text-xs">{logs.length} ta faoliyat</p>
                </div>
              </div>
              {logs.length > 0 && (
                <button
                  onClick={clearLogs}
                  className="text-xs text-red-500 font-semibold hover:text-red-600 transition"
                >
                  Tozalash
                </button>
              )}
            </div>
            {logs.length === 0 ? (
              <div className="text-center py-8 px-4">
                <i className="fas fa-bell-slash text-2xl text-gray-300 mb-2"></i>
                <p className="text-gray-400 text-sm">Bildirishnomalar mavjud emas</p>
              </div>
            ) : (
              <div className="divide-y divide-blue-100/40">
                {[...logs].reverse().slice(0, 6).map((log) => {
                  const ic = getLogIcon(log.type);
                  return (
                    <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-8 h-8 ${ic.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <i className={`fas ${ic.icon} text-xs`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 text-sm truncate">{log.text}</p>
                        <p className="text-gray-400 text-xs">{log.time}</p>
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
            className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-3 shadow-lg cursor-pointer animate-slide-up"
          >
            <i className="fas fa-sign-out-alt text-lg"></i>
            Tizimdan chiqish
          </button>

        </div>
      </div>
    </div>
  );
}
