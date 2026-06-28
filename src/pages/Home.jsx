import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/web-daftar.png";
import api from "../utils/api";

export default function Home() {
  const navigate = useNavigate();
  const [qarzlar, setQarzlar] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (!userStr) { navigate("/login"); return; }
    const loggedUser = JSON.parse(userStr);
    setCurrentUser(loggedUser);

    const loadFilteredDebts = async () => {
      const res = await api.get("/debts");
      if (!res.error) {
        setQarzlar(res);
      }
    };

    loadFilteredDebts();
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
      <div className="main-background" />

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
          <div className="glass-card-premium card-gradient-blue hover-shadow-blue rounded-3xl p-6 animate-slide-up">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Umumiy to'lanmagan</p>
            <p className="text-4xl font-black text-blue-700">
              {formatMoney(unpaid.reduce((s, q) => s + Number(q.qarzMiqdori || q.miqdor || 0), 0))} <span className="text-lg font-semibold text-blue-400">so'm</span>
            </p>
            <div className="mt-4 pt-4 border-t border-blue-100/50 flex gap-4">
              <div>
                <p className="text-slate-400 text-xs font-medium">Qarzlar soni</p>
                <p className="text-slate-800 font-extrabold text-lg">{unpaid.length} ta</p>
              </div>
              <div className="w-px bg-blue-100/60"></div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Muddati o'tgan</p>
                <p className="text-rose-600 font-extrabold text-lg">{overdue.length} ta</p>
              </div>
              <div className="w-px bg-blue-100/60"></div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Bugun to'lanadi</p>
                <p className="text-amber-600 font-extrabold text-lg">{todayDue.length} ta</p>
              </div>
            </div>
          </div>

          {/* Stats Row: Daily & Monthly */}
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            <div className="glass-card-premium card-gradient-red hover-shadow-red rounded-2xl p-4 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-amber-400/20 to-orange-500/20 border border-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-day text-orange-500 text-sm"></i>
                </div>
                <p className="text-slate-500 text-xs font-bold">Bugungi</p>
              </div>
              <p className="text-2xl font-black text-slate-800">
                {formatMoney(qarzlar
                  .filter((q) => q.tolashMuddati?.startsWith(todayStr))
                  .reduce((s, q) => s + Number(q.qarzMiqdori || q.miqdor || 0), 0))}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">so'm</p>
            </div>
            <div className="glass-card-premium card-gradient-blue hover-shadow-blue rounded-2xl p-4 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-indigo-400/20 to-purple-500/20 border border-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-purple-500 text-sm"></i>
                </div>
                <p className="text-slate-500 text-xs font-bold">Oylik</p>
              </div>
              <p className="text-2xl font-black text-slate-800">
                {formatMoney(monthlyAdded.reduce((s, q) => s + Number(q.qarzMiqdori || q.miqdor || 0), 0))}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">so'm</p>
            </div>
          </div>

          {/* Today's Due Debts */}
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-800 font-extrabold text-base flex items-center gap-2">
                <i className="fas fa-clock text-amber-500"></i>
                Bugun to'lanishi kerak
              </h2>
              <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold px-2 py-0.5 rounded-full">
                {todayDue.length} ta
              </span>
            </div>

            {todayDue.length === 0 ? (
              <div className="glass-card-premium rounded-3xl p-6 text-center">
                <i className="fas fa-check-circle text-3xl text-emerald-500 mb-2"></i>
                <p className="text-slate-700 font-semibold">Bugun to'lanishi kerak bo'lgan qarz yo'q</p>
                <p className="text-slate-400 text-xs mt-1">Barcha qarzlar belgilangan!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayDue.map((q) => (
                  <div
                    key={q.id}
                    className="glass-card-premium hover-shadow-blue rounded-2xl p-4 flex items-center gap-3 border-l-4 border-l-amber-500"
                  >
                    <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-user text-amber-500"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-bold text-sm truncate">{q.mijozIsmi}</p>
                      <p className="text-slate-400 text-xs">{q.telefon || "—"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-amber-600 font-black text-sm">
                        {Number(q.qarzMiqdori || q.miqdor || 0).toLocaleString()}
                      </p>
                      <p className="text-slate-400 text-xs">so'm</p>
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
                <h2 className="text-slate-800 font-extrabold text-base flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle text-rose-500"></i>
                  Muddati o'tgan
                </h2>
                <span className="bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold px-2 py-0.5 rounded-full">
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
                      className="glass-card-premium hover-shadow-red rounded-2xl p-4 flex items-center gap-3 border-l-4 border-l-rose-500"
                    >
                      <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-user text-rose-500"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 font-bold text-sm truncate">{q.mijozIsmi}</p>
                        <p className="text-rose-500 text-xs font-semibold">{daysLate} kun kechikkan</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-rose-600 font-black text-sm">
                          {Number(q.qarzMiqdori || q.miqdor || 0).toLocaleString()}
                        </p>
                        <p className="text-slate-400 text-xs">so'm</p>
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



        </div>
      </div>
    </div>
  );
}
