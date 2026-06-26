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
    setCurrentUser(JSON.parse(userStr));

    const savedLogs = JSON.parse(localStorage.getItem("activity_logs")) || [];
    setLogs(savedLogs);

    const qarzlar = JSON.parse(localStorage.getItem("qarzlar")) || [];
    setQarzStats({
      total: qarzlar.length,
      paid: qarzlar.filter((q) => q.status === "To'langan").length,
      overdue: qarzlar.filter(
        (q) => new Date(q.tolashMuddati) < new Date() && q.status !== "To'langan"
      ).length,
    });
  }, [navigate]);

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
      {/* Gradient background — bright vivid blue */}
      <div
        className="fixed inset-0 z-[-2]"
        style={{
          background: "linear-gradient(160deg, #1e40af 0%, #2563eb 40%, #7c3aed 100%)",
        }}
      />
      {/* Subtle soft overlay shapes */}
      <div
        className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none"
      >
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 -left-20 w-56 h-56 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent 70%)" }}
        />
        <div
          className="absolute bottom-32 right-8 w-40 h-40 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }}
        />
      </div>

      <div className="min-h-screen pb-24">

        {/* Header */}
        <div className="px-4 pt-6 pb-2 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 bg-white/25 hover:bg-white/35 text-white rounded-full flex items-center justify-center transition active:scale-95 backdrop-blur-sm border border-white/30"
          >
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
          <h1 className="text-white font-bold text-xl drop-shadow">Shaxsiy Kabinet</h1>
        </div>

        <div className="px-4 pt-2 space-y-4">

          {/* User Card */}
          <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-xl animate-slide-up">
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
            <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
              <p className="text-3xl font-black text-blue-600">{qarzStats.total}</p>
              <p className="text-xs text-gray-500 font-semibold mt-1">Jami</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
              <p className="text-3xl font-black text-green-500">{qarzStats.paid}</p>
              <p className="text-xs text-gray-500 font-semibold mt-1">To'langan</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
              <p className="text-3xl font-black text-red-500">{qarzStats.overdue}</p>
              <p className="text-xs text-gray-500 font-semibold mt-1">Muddati o'tgan</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl animate-slide-up">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={`w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition active:bg-gray-100 text-left cursor-pointer ${
                  index < menuItems.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className={`w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <i className={`fas ${item.icon} text-base`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-semibold text-sm">{item.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{item.sublabel}</p>
                </div>
                <i className="fas fa-chevron-right text-gray-300 text-xs flex-shrink-0"></i>
              </button>
            ))}
          </div>

          {/* App Info */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl animate-slide-up">
            <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
              <div className="w-11 h-11 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fas fa-info-circle text-base"></i>
              </div>
              <div className="flex-1">
                <p className="text-gray-800 font-semibold text-sm">Ilova haqida</p>
                <p className="text-gray-400 text-xs mt-0.5">Kiyim Magazini — Web Daftar v1.0</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="w-11 h-11 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="fab fa-telegram text-base"></i>
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Telegram kanal</p>
                <p className="text-gray-800 font-semibold text-sm">@QarzDaftar</p>
              </div>
              <i className="fas fa-chevron-right text-gray-300 text-xs flex-shrink-0"></i>
            </div>
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
