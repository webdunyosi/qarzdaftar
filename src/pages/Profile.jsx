import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../assets/web-daftar.png";

export default function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }
    setCurrentUser(JSON.parse(userStr));

    const savedLogs = JSON.parse(localStorage.getItem("activity_logs")) || [];
    setLogs(savedLogs);
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
      color: "bg-indigo-500/15 text-indigo-500",
      action: () => navigate("/diagram"),
    },
    {
      icon: "fa-list-ul",
      label: "Qarzlar ro'yxati",
      sublabel: "Barcha qarzlarni ko'rish",
      color: "bg-blue-500/15 text-blue-500",
      action: () => navigate("/debts"),
    },
    {
      icon: "fa-plus-circle",
      label: "Yangi qarz qo'shish",
      sublabel: "Mijoz qarzini kiritish",
      color: "bg-green-500/15 text-green-500",
      action: () => navigate("/add-debt"),
    },
    {
      icon: "fa-bell",
      label: "Bildirishnomalar",
      sublabel: `${logs.length} ta faoliyat logi`,
      color: "bg-yellow-500/15 text-yellow-500",
      action: () => navigate("/notifications"),
    },
  ];

  return (
    <div>
      <div className="main-background"></div>
      <div className="backdrop-blur min-h-screen pb-20">

        {/* Header */}
        <div className="px-4 pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition active:scale-95"
          >
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
          <h1 className="text-white font-bold text-lg">Shaxsiy Kabinet</h1>
        </div>

        <div className="px-4 space-y-4">

          {/* User Card */}
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex items-center gap-4 shadow-xl animate-slide-up">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 bg-blue-500/20 border-2 border-blue-400 rounded-full flex items-center justify-center shadow-lg">
                <i className="fas fa-user-tie text-3xl text-blue-300"></i>
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-xl capitalize truncate">
                {currentUser?.username || "Mehmon"}
              </h2>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mt-0.5">
                {currentUser?.role === "admin" ? "Tizim Administratori" : "Operator / Foydalanuvchi"}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full px-3 py-0.5">
                <i className="fas fa-shield-alt text-[9px] text-blue-300"></i>
                <span className="text-[10px] text-blue-200 font-semibold uppercase tracking-wider">
                  {currentUser?.role || "user"}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <img src={logo} alt="Logo" className="w-11 h-11 rounded-xl opacity-80" />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 animate-slide-up">
            {(() => {
              const qarzlar = JSON.parse(localStorage.getItem("qarzlar")) || [];
              const total = qarzlar.length;
              const paid = qarzlar.filter(q => q.status === "To'langan").length;
              const overdue = qarzlar.filter(q => new Date(q.tolashMuddati) < new Date() && q.status !== "To'langan").length;
              return [
                { label: "Jami", value: total, color: "text-blue-300", bg: "bg-blue-500/15 border-blue-400/20" },
                { label: "To'langan", value: paid, color: "text-green-300", bg: "bg-green-500/15 border-green-400/20" },
                { label: "Muddati o'tgan", value: overdue, color: "text-red-300", bg: "bg-red-500/15 border-red-400/20" },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.bg} border backdrop-blur-sm rounded-xl p-3 text-center`}>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-white/60 font-medium mt-0.5">{stat.label}</p>
                </div>
              ));
            })()}
          </div>

          {/* Menu Items */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden shadow-xl animate-slide-up">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={`w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/10 transition active:bg-white/20 text-left cursor-pointer ${
                  index < menuItems.length - 1 ? "border-b border-white/10" : ""
                }`}
              >
                <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <i className={`fas ${item.icon} text-base`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  <p className="text-white/50 text-xs mt-0.5">{item.sublabel}</p>
                </div>
                <i className="fas fa-chevron-right text-white/30 text-xs flex-shrink-0"></i>
              </button>
            ))}
          </div>

          {/* App Info */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden shadow-xl animate-slide-up">
            <div className="flex items-center gap-4 px-4 py-3.5 border-b border-white/10">
              <div className="w-10 h-10 bg-purple-500/15 text-purple-400 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-info-circle text-base"></i>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Ilova haqida</p>
                <p className="text-white/50 text-xs mt-0.5">Kiyim Magazini - Web Daftar v1.0</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 py-3.5">
              <div className="w-10 h-10 bg-cyan-500/15 text-cyan-400 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fab fa-telegram text-base"></i>
              </div>
              <div className="flex-1">
                <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">Telegram kanal</p>
                <p className="text-white font-semibold text-sm">@QarzDaftar</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 border border-red-500/30 text-red-300 font-bold py-4 rounded-2xl transition flex items-center justify-center gap-3 shadow-lg cursor-pointer animate-slide-up"
          >
            <i className="fas fa-sign-out-alt text-lg"></i>
            Tizimdan chiqish
          </button>

        </div>
      </div>
    </div>
  );
}
