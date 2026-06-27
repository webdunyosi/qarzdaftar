import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/web-daftar.png";

export default function Home() {
  const navigate = useNavigate();
  const [qarzlar, setQarzlar] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (!userStr) { navigate("/login"); return; }
    setCurrentUser(JSON.parse(userStr));

    const saved = JSON.parse(localStorage.getItem("qarzlar")) || [];
    setQarzlar(saved);

    const onStorage = () => setQarzlar(JSON.parse(localStorage.getItem("qarzlar")) || []);
    window.addEventListener("storage", onStorage);
    window.addEventListener("qarzlar_updated", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("qarzlar_updated", onStorage);
    };
  }, [navigate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Today's due debts (deadline is today AND not paid)
  const todayDue = qarzlar.filter((q) => {
    const d = new Date(q.tolashMuddati);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() && q.status !== "To'langan";
  });

  // Overdue (deadline passed, not paid)
  const overdue = qarzlar.filter((q) => {
    const d = new Date(q.tolashMuddati);
    d.setHours(0, 0, 0, 0);
    return d < today && q.status !== "To'langan";
  });

  // Not paid total
  const unpaid = qarzlar.filter((q) => q.status !== "To'langan");

  // Monthly: debts added this month
  const monthlyAdded = qarzlar.filter((q) => {
    const d = new Date(q.sana || q.createdAt || q.tolashMuddati);
    return d >= monthStart && d <= monthEnd;
  });
  const monthlyTotal = monthlyAdded.reduce((s, q) => s + Number(q.miqdor || 0), 0);

  // Daily total (debts due today, paid or unpaid)
  const dailyTotal = qarzlar
    .filter((q) => q.tolashMuddati?.startsWith(todayStr))
    .reduce((s, q) => s + Number(q.miqdor || 0), 0);

  const totalUnpaidAmount = unpaid.reduce((s, q) => s + Number(q.miqdor || 0), 0);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Xayrli tong";
    if (h < 17) return "Xayrli kun";
    return "Xayrli kech";
  };

  const formatMoney = (n) =>
    n >= 1000000
      ? (n / 1000000).toFixed(1) + " mln"
      : n.toLocaleString("uz-UZ");

  const getUzbekDate = () => {
    const now = new Date();
    const months = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];
    const weekdays = [
      "Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"
    ];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const weekday = weekdays[now.getDay()];
    return `${day}-${month} ${weekday}`;
  };

  const statusColor = (q) => {
    if (q.status === "To'langan") return "text-green-500";
    const d = new Date(q.tolashMuddati); d.setHours(0,0,0,0);
    return d < today ? "text-red-500" : "text-yellow-500";
  };

  const statusBg = (q) => {
    if (q.status === "To'langan") return "bg-green-100 text-green-700";
    const d = new Date(q.tolashMuddati); d.setHours(0,0,0,0);
    return d < today ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700";
  };

  return (
    <div>
      {/* Solid white background */}
      <div className="fixed inset-0 z-[-2]" style={{ backgroundColor: "#ffffff" }} />

      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="px-4 pt-6 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl shadow" />
            <div>
              <p className="text-slate-500 text-xs font-semibold">{greet()},</p>
              <h1 className="text-slate-800 font-bold text-lg leading-tight capitalize">
                {currentUser?.username || "Admin"}
              </h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Bugun</p>
            <p className="text-slate-700 font-bold text-sm whitespace-nowrap">
              {getUzbekDate()}
            </p>
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* Main Summary Card */}
          <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-5 shadow-md animate-slide-up">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Umumiy to'lanmagan</p>
            <p className="text-4xl font-black text-blue-700">{formatMoney(totalUnpaidAmount)} <span className="text-lg font-semibold text-blue-400">so'm</span></p>
            <div className="mt-3 flex gap-4">
              <div>
                <p className="text-gray-400 text-xs">Qarzlar soni</p>
                <p className="text-gray-800 font-bold text-lg">{unpaid.length} ta</p>
              </div>
              <div className="w-px bg-blue-100"></div>
              <div>
                <p className="text-gray-400 text-xs">Muddati o'tgan</p>
                <p className="text-red-600 font-bold text-lg">{overdue.length} ta</p>
              </div>
              <div className="w-px bg-blue-100"></div>
              <div>
                <p className="text-gray-400 text-xs">Bugun to'lanadi</p>
                <p className="text-orange-600 font-bold text-lg">{todayDue.length} ta</p>
              </div>
            </div>
          </div>

          {/* Stats Row: Daily & Monthly */}
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-4 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-day text-orange-500 text-sm"></i>
                </div>
                <p className="text-gray-500 text-xs font-semibold">Bugungi</p>
              </div>
              <p className="text-2xl font-black text-gray-800">{formatMoney(dailyTotal)}</p>
              <p className="text-gray-400 text-xs mt-0.5">so'm</p>
            </div>
            <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-4 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-purple-500 text-sm"></i>
                </div>
                <p className="text-gray-500 text-xs font-semibold">Oylik</p>
              </div>
              <p className="text-2xl font-black text-gray-800">{formatMoney(monthlyTotal)}</p>
              <p className="text-gray-400 text-xs mt-0.5">so'm</p>
            </div>
          </div>

          {/* Today's Due Debts */}
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-800 font-bold text-base flex items-center gap-2">
                <i className="fas fa-clock text-yellow-500"></i>
                Bugun to'lanishi kerak
              </h2>
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                {todayDue.length} ta
              </span>
            </div>

            {todayDue.length === 0 ? (
              <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-6 text-center shadow-md">
                <i className="fas fa-check-circle text-3xl text-green-500 mb-2"></i>
                <p className="text-slate-700 font-semibold">Bugun to'lanishi kerak bo'lgan qarz yo'q</p>
                <p className="text-slate-400 text-xs mt-1">Barcha qarzlar belgilangan!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayDue.map((q) => (
                  <div
                    key={q.id}
                    className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-4 shadow-md flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-user text-orange-500"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-bold text-sm truncate">{q.mijozIsmi}</p>
                      <p className="text-gray-400 text-xs">{q.telefon || "—"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-orange-600 font-black text-sm">{Number(q.miqdor || 0).toLocaleString()}</p>
                      <p className="text-gray-400 text-xs">so'm</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Debts */}
          {overdue.length > 0 && (
            <div className="animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-slate-800 font-bold text-base flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle text-red-500"></i>
                  Muddati o'tgan
                </h2>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {overdue.length} ta
                </span>
              </div>
              <div className="space-y-3">
                {overdue.slice(0, 5).map((q) => {
                  const daysLate = Math.floor(
                    (today - new Date(q.tolashMuddati)) / 86400000
                  );
                  return (
                    <div
                      key={q.id}
                      className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-4 shadow-md flex items-center gap-3 border-l-4 border-red-400"
                    >
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-user text-red-500"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-bold text-sm truncate">{q.mijozIsmi}</p>
                        <p className="text-red-500 text-xs">{daysLate} kun kechikkan</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-red-600 font-black text-sm">{Number(q.miqdor || 0).toLocaleString()}</p>
                        <p className="text-gray-400 text-xs">so'm</p>
                      </div>
                    </div>
                  );
                })}
                {overdue.length > 5 && (
                  <button
                    onClick={() => navigate("/debts")}
                    className="w-full text-center text-blue-600 text-sm font-semibold py-2 hover:text-blue-700 transition"
                  >
                    Yana {overdue.length - 5} ta ko'rish →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="animate-slide-up">
            <h2 className="text-slate-800 font-bold text-base mb-3">Tez harakatlar</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => navigate("/add-debt")}
                className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-4 shadow-md flex flex-col items-center gap-2 active:scale-95 transition cursor-pointer"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-plus text-blue-600"></i>
                </div>
                <span className="text-gray-700 text-xs font-semibold text-center">Qarz qo'shish</span>
              </button>
              <button
                onClick={() => navigate("/debts")}
                className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-4 shadow-md flex flex-col items-center gap-2 active:scale-95 transition cursor-pointer"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-list text-green-600"></i>
                </div>
                <span className="text-gray-700 text-xs font-semibold text-center">Ro'yxat</span>
              </button>
              <button
                onClick={() => navigate("/diagram")}
                className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-4 shadow-md flex flex-col items-center gap-2 active:scale-95 transition cursor-pointer"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <i className="fas fa-chart-line text-purple-600"></i>
                </div>
                <span className="text-gray-700 text-xs font-semibold text-center">Diagrama</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
