import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import api from "../utils/api";

// Telegram configurations
const TELEGRAM_BOT_TOKEN = "7972518235:AAEIhLp-LVENoe5DCweerO8l-9oK5KFZyRw";
const TELEGRAM_CHAT_ID = "-1002294610813";

async function sendTelegramMessage(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram bot token yoki chat ID kiritilmagan!");
    return;
  }
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );
    if (!response.ok) throw new Error("Telegram xabari yuborilmadi");
  } catch (error) {
    console.error("Telegram xabari yuborishda xatolik:", error);
  }
}

async function sendTelegramFile(file, caption) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram bot token yoki chat ID kiritilmagan!");
    return;
  }
  try {
    const formData = new FormData();
    formData.append("chat_id", TELEGRAM_CHAT_ID);
    formData.append("document", file);
    formData.append("caption", caption);

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
      { method: "POST", body: formData }
    );
    if (!response.ok) throw new Error("Telegram fayli yuborilmadi");
  } catch (error) {
    console.error("Telegram fayl yuborishda xatolik:", error);
  }
}

export default function DebtsList() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [qarzlar, setQarzlar] = useState([]);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sanaFilter, setSanaFilter] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  const [expandedGroups, setExpandedGroups] = useState({});

  // Activity logger helper
  const addActivityLog = async (text, type) => {
    try {
      await api.post("/logs", { text, type });
    } catch (e) {
      console.error("Log error", e);
    }
  };

  // Load Initial Data
  const loadFilteredDebts = async () => {
    const res = await api.get("/debts");
    if (!res.error) {
      setQarzlar(res);
    }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }
    const loggedUser = JSON.parse(userStr);
    setCurrentUser(loggedUser);

    loadFilteredDebts();
  }, [navigate]);

  // Mark as paid
  const qarzniTolash = async (id) => {
    const target = qarzlar.find((q) => (q.id || q._id) === id);
    if (!target) return;

    const res = await api.put(`/debts/${id}`, { status: "To'langan" });
    if (res.error) {
      toast.error(res.error);
      return;
    }

    const message = `✅ <b>Qarz to'landi (Mobil)</b>\n\n👤 Mijoz: ${
      res.mijozIsmi
    }\n📱 Telefon: ${res.telefon}\n👕 Mahsulot: ${
      res.mahsulot
    }\n💰 Qarz miqdori: ${res.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
      res.sana
    ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
      res.tolashMuddati
    ).toLocaleDateString()}`;
    
    sendTelegramMessage(message);
    await addActivityLog(`Qarz to'landi: ${res.mijozIsmi} (${res.qarzMiqdori.toLocaleString()} so'm)`, "pay");

    toast.success("Qarz to'langan deb belgilandi!");
    loadFilteredDebts();
  };

  // Delete debt
  const qarzniOchirish = (id) => {
    setConfirmModal({
      isOpen: true,
      message: "Bu qarzni o'chirishni xohlaysizmi?",
      onConfirm: () => executeDelete(id),
    });
  };

  const executeDelete = async (id) => {
    const target = qarzlar.find((q) => (q.id || q._id) === id);
    if (!target) return;

    const res = await api.delete(`/debts/${id}`);
    if (res.error) {
      toast.error(res.error);
      return;
    }

    const message = `❌ <b>Qarz o'chirildi (Mobil)</b>\n\n👤 Mijoz: ${
      target.mijozIsmi
    }\n📱 Telefon: ${target.telefon}\n👕 Mahsulot: ${
      target.mahsulot
    }\n💰 Qarz miqdori: ${target.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
      target.sana
    ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
      target.tolashMuddati
    ).toLocaleDateString()}`;
    
    sendTelegramMessage(message);
    await addActivityLog(`Qarz o'chirildi: ${target.mijozIsmi}`, "delete");

    toast.success("Qarz muvaffaqiyatli o'chirildi!");
    setConfirmModal({ isOpen: false, message: "", onConfirm: null });
    loadFilteredDebts();
  };

  // Redirect to edit page
  const qarzniTahrirlash = (qarz) => {
    navigate("/add-debt", { state: { editDebt: qarz } });
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      const bugun = new Date();
      const formattedDateTime = bugun
        .toLocaleString("uz-UZ", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(/[/:]/g, "-")
        .replace(",", "_");

      const excelData = qarzlar.map((q) => {
        const tolashMuddatiDate = new Date(q.tolashMuddati);
        const qolganKunlar = Math.ceil((tolashMuddatiDate - bugun) / (1000 * 60 * 60 * 24));

        let qolganKunlarText = "";
        if (q.status === "To'langan") {
          qolganKunlarText = "To'langan";
        } else if (qolganKunlar < 0) {
          qolganKunlarText = `${Math.abs(qolganKunlar)} kun o'tgan`;
        } else if (qolganKunlar === 0) {
          qolganKunlarText = "Bugun";
        } else {
          qolganKunlarText = `${qolganKunlar} kun qoldi`;
        }

        return {
          "Mijoz ismi": q.mijozIsmi,
          Telefon: q.telefon,
          Mahsulot: q.mahsulot,
          "Qarz miqdori": q.qarzMiqdori,
          Sana: new Date(q.sana).toLocaleDateString(),
          "To'lash muddati": new Date(q.tolashMuddati).toLocaleDateString(),
          Holati: q.status,
          "Qolgan kunlar": qolganKunlarText,
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Qarzlar");

      const fileName = `Qarzlar_${formattedDateTime}.xlsx`;
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const file = new File([blob], fileName, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const caption = `📊 Qarzlar hisoboti (Mobil)\n\n📅 Sana va vaqt: ${bugun.toLocaleString(
        "uz-UZ"
      )}\n👥 Jami mijozlar: ${qarzlar.length}\n💰 Jami qarzlar: ${qarzlar
        .reduce((sum, q) => sum + q.qarzMiqdori, 0)
        .toLocaleString()} so'm`;

      XLSX.writeFile(wb, fileName);
      await sendTelegramFile(file, caption);

      toast.success("Excel fayli yuklandi va Telegram kanalga yuborildi!");
    } catch (error) {
      console.error("Excel yaratishda xatolik:", error);
      toast.error("Excel faylini yaratishda xatolik yuz berdi!");
    }
  };

  const today = new Date();

  // Filtered List
  const filteredQarzlar = qarzlar
    .filter((q) => {
      const searchMatch =
        q.mijozIsmi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.telefon.includes(searchTerm) ||
        q.mahsulot.toLowerCase().includes(searchTerm.toLowerCase());
      
      let dateMatch = true;
      if (sanaFilter) {
        const qarzSanaStr = new Date(q.sana).toISOString().split("T")[0];
        dateMatch = qarzSanaStr === sanaFilter;
      }

      return searchMatch && dateMatch;
    })
    .filter((q) => {
      if (filterType === "tolangan") return q.status === "To'langan";
      if (filterType === "tolanmagan") {
        return new Date(q.tolashMuddati) >= today && q.status === "To'lanmagan";
      }
      if (filterType === "muddatiOtgan") {
        return new Date(q.tolashMuddati) < today && q.status === "To'lanmagan";
      }
      return true; // "all"
    })
    .reverse();

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const yangiQarzQoshishMijoz = (mijozIsmi, telefon) => {
    navigate("/add-debt", { state: { prefill: { mijozIsmi, telefon } } });
  };

  const getAvatarGradient = (name) => {
    const char = name.trim().charAt(0).toUpperCase();
    const index = char.charCodeAt(0) % 5;
    const gradients = [
      "from-indigo-500 to-purple-600",
      "from-emerald-400 to-teal-600",
      "from-blue-500 to-indigo-600",
      "from-rose-400 to-red-600",
      "from-amber-400 to-orange-600",
    ];
    return gradients[index];
  };

  // Group debts by customer for mobile view
  const groupedDebts = filteredQarzlar.reduce((acc, q) => {
    const key = `${q.mijozIsmi.trim().toLowerCase()}_${q.telefon.trim()}`;
    if (!acc[key]) {
      acc[key] = {
        mijozIsmi: q.mijozIsmi,
        telefon: q.telefon,
        items: [],
      };
    }
    acc[key].items.push(q);
    return acc;
  }, {});
  const groupedDebtsList = Object.values(groupedDebts);

  return (
    <div>
      <div className="main-background"></div>
      {/* Fixed wrapper from top to just above bottom nav */}
      <div style={{position: 'fixed', inset: 0, bottom: '4rem', overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', zIndex: 10, background: 'transparent'}}>
        <div className="w-full glass-card-premium p-4 sm:p-6 rounded-3xl animate-slide-up" style={{flex: 1, display: 'flex', flexDirection: 'column', background: 'white', transform: 'none'}}>
          
          {/* Header & Back Button */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-800">
                Qarzlar Ro'yxati ({filteredQarzlar.length})
              </h2>
            </div>

            <button
              onClick={exportToExcel}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm transition cursor-pointer"
            >
              <i className="fas fa-file-excel mr-2"></i>
              <span>Excelga eksport</span>
            </button>
          </div>

          {/* Search box & Date filter */}
          <div className="flex items-center gap-2 mb-2 w-full">
            <div className="search-box flex items-center bg-white border border-gray-300 rounded-full px-3 py-1.5 w-1/2">
              <i className="fas fa-search text-gray-400 mr-1.5 text-xs"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Mijoz, telefon..."
                className="outline-none text-xs w-full bg-transparent border-none !p-0 !pl-1 focus:ring-0 focus:outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times-circle text-xs"></i>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-3 py-1.5 w-1/2">
              <i className="fas fa-calendar text-gray-400"></i>
              <input
                type="date"
                value={sanaFilter}
                onChange={(e) => setSanaFilter(e.target.value)}
                className="outline-none text-xs w-full bg-transparent border-none !p-0 !pl-1 focus:ring-0 cursor-pointer"
              />
              {sanaFilter && (
                <button onClick={() => setSanaFilter("")} className="text-red-500 hover:text-red-700">
                  <i className="fas fa-times-circle text-xs"></i>
                </button>
              )}
            </div>
          </div>

          {/* Filter buttons */}
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            <button
              onClick={() => setFilterType("all")}
              className={`filter-btn flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                filterType === "all" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <i className="fas fa-list"></i>
              <span className="hidden sm:inline">Barchasi</span>
            </button>
            
            <button
              onClick={() => setFilterType("tolangan")}
              className={`filter-btn flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                filterType === "tolangan" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <i className="fas fa-check"></i>
              <span className="hidden sm:inline">To'langan</span>
            </button>
            
            <button
              onClick={() => setFilterType("tolanmagan")}
              className={`filter-btn flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                filterType === "tolanmagan" ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <i className="fas fa-clock"></i>
              <span className="hidden sm:inline">To'lanmagan</span>
            </button>
            
            <button
              onClick={() => setFilterType("muddatiOtgan")}
              className={`filter-btn flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                filterType === "muddatiOtgan" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <i className="fas fa-exclamation-circle"></i>
              <span className="hidden sm:inline">Muddati o'tgan</span>
            </button>
          </div>

          {/* Table */}
          {/* Table (Desktop View) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/75">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Mijoz</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Telefon</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Mahsulot</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Qarz miqdori</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Sana</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">To'lash muddati</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white/95 divide-y divide-gray-200">
                {filteredQarzlar.map((q) => {
                  const tolashDate = new Date(q.tolashMuddati);
                  const overdue = today > tolashDate && q.status === "To'lanmagan";
                  const remainingDays = Math.ceil((tolashDate - today) / (1000 * 60 * 60 * 24));

                  let remainingText = "";
                  if (q.status === "To'langan") {
                    remainingText = <span className="text-green-600 font-medium">To'langan</span>;
                  } else if (overdue) {
                    remainingText = <span className="text-red-600 font-bold">{Math.abs(remainingDays)} kun o'tgan</span>;
                  } else if (remainingDays === 0) {
                    remainingText = <span className="text-yellow-600 font-bold">Bugun</span>;
                  } else {
                    remainingText = <span className="text-blue-600 font-medium">{remainingDays} kun qoldi</span>;
                  }

                  const statusBadge =
                    q.status === "To'langan" ? (
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-green-600 bg-green-100 rounded-full">
                        To'langan
                      </span>
                    ) : overdue ? (
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-red-600 bg-red-100 rounded-full">
                        Muddati o'tgan
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-yellow-600 bg-yellow-100 rounded-full">
                        To'lanmagan
                      </span>
                    );

                  return (
                    <tr key={q.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-user text-gray-500 text-sm"></i>
                          </div>
                          <div className="ml-2.5">
                            <div className="text-sm font-medium text-gray-900">{q.mijozIsmi}</div>
                            {statusBadge}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a href={`tel:${q.telefon}`} className="text-sm text-blue-700 font-medium hover:underline flex items-center gap-1">
                          <i className="fas fa-phone text-blue-500 text-xs"></i>
                          {q.telefon}
                        </a>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900 flex items-center gap-1">
                          <i className="fas fa-tshirt text-gray-400 text-xs"></i>
                          {q.mahsulot}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-semibold flex items-center gap-1">
                          <i className="fas fa-money-bill-alt text-gray-400 text-xs"></i>
                          {q.qarzMiqdori.toLocaleString()} so'm
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(q.sana).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-950">
                        <div>{new Date(q.tolashMuddati).toLocaleDateString()}</div>
                        <div className="text-[10px] mt-0.5">{remainingText}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => yangiQarzQoshishMijoz(q.mijozIsmi, q.telefon)}
                            className="text-white bg-indigo-500 hover:bg-indigo-600 px-2.5 py-1 rounded transition text-xs font-semibold cursor-pointer"
                            title="Yangi qarz qo'shish"
                          >
                            <i className="fas fa-plus mr-1"></i>
                            Qarz+
                          </button>

                          {q.status !== "To'langan" && (
                            <button
                              onClick={() => qarzniTolash(q.id)}
                              className="text-white bg-green-500 hover:bg-green-600 px-2.5 py-1 rounded transition text-xs font-semibold cursor-pointer"
                            >
                              <i className="fas fa-check mr-1"></i>
                              To'landi
                            </button>
                          )}
                          
                          {currentUser?.role === "admin" && (
                            <>
                              <button
                                onClick={() => qarzniTahrirlash(q)}
                                className="text-white bg-yellow-500 hover:bg-yellow-600 px-2.5 py-1 rounded transition text-xs font-semibold cursor-pointer"
                              >
                                <i className="fas fa-edit mr-1"></i>
                                Tahrirlash
                              </button>
                              <button
                                onClick={() => qarzniOchirish(q.id)}
                                className="text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded transition text-xs font-semibold cursor-pointer"
                              >
                                <i className="fas fa-trash mr-1"></i>
                                O'chirish
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredQarzlar.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      <i className="fas fa-search text-3xl mb-2 text-gray-300"></i>
                      <p className="text-sm">Hech qanday qarz topilmadi</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Accordion List (Mobile View) */}
          <div className="block md:hidden space-y-3 flex-1">
            {groupedDebtsList.map((group) => {
              const key = `${group.mijozIsmi.trim().toLowerCase()}_${group.telefon.trim()}`;
              const isExpanded = expandedGroups[key];
              
              // Calculate group status indicator dot
              const hasOverdue = group.items.some((item) => {
                const tolashDate = new Date(item.tolashMuddati);
                return today > tolashDate && item.status === "To'lanmagan";
              });
              const hasUnpaid = group.items.some((item) => item.status === "To'lanmagan");
              
              let dotColor = "bg-green-500";
              if (hasOverdue) {
                dotColor = "bg-red-500 animate-pulse";
              } else if (hasUnpaid) {
                dotColor = "bg-yellow-500 animate-pulse";
              }

              return (
                <div key={key} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Customer Header */}
                  <div
                    onClick={() => toggleGroup(key)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition active:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr ${getAvatarGradient(group.mijozIsmi)} shadow-sm`}>
                        {group.mijozIsmi.trim().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-800 capitalize">
                            {group.mijozIsmi}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {group.telefon}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          yangiQarzQoshishMijoz(group.mijozIsmi, group.telefon);
                        }}
                        className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition active:scale-90"
                        title="Yangi qarz qo'shish"
                      >
                        <i className="fas fa-plus text-xs"></i>
                      </button>
                      <a
                        href={`tel:${group.telefon}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition active:scale-90"
                      >
                        <i className="fas fa-phone text-xs"></i>
                      </a>
                      <a
                        href={`https://t.me/${group.telefon.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition active:scale-90"
                      >
                        <i className="fab fa-telegram-plane text-xs"></i>
                      </a>
                      <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center">
                        <i className={`fas ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"} text-xs transition-transform duration-200`}></i>
                      </div>
                    </div>
                  </div>

                  {/* Customer Debts List */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-50 bg-gray-50/30 space-y-3">
                      {group.items.map((item) => {
                        const tolashDate = new Date(item.tolashMuddati);
                        const overdue = today > tolashDate && item.status === "To'lanmagan";
                        const remainingDays = Math.ceil((tolashDate - today) / (1000 * 60 * 60 * 24));

                        let remainingText = "";
                        let borderClass = "border-l-yellow-500 bg-yellow-50/15";
                        let statusColor = "text-yellow-600 bg-yellow-50";
                        
                        if (item.status === "To'langan") {
                          remainingText = <span className="text-green-600 font-medium">To'langan</span>;
                          borderClass = "border-l-green-500 bg-green-50/15";
                          statusColor = "text-green-600 bg-green-50";
                        } else if (overdue) {
                          remainingText = <span className="text-red-600 font-bold">{Math.abs(remainingDays)} kun o'tgan</span>;
                          borderClass = "border-l-red-500 bg-red-50/15";
                          statusColor = "text-red-600 bg-red-50";
                        } else if (remainingDays === 0) {
                          remainingText = <span className="text-yellow-600 font-bold">Bugun</span>;
                        } else {
                          remainingText = <span className="text-blue-600 font-medium">{remainingDays} kun qoldi</span>;
                        }

                        return (
                          <div key={item.id} className={`p-3 rounded-xl border-l-4 ${borderClass} shadow-sm space-y-2 animate-fade-in`}>
                            {/* Sub-card header */}
                            <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                              <span>📅 {new Date(item.sana).toLocaleDateString("uz-UZ")}</span>
                              <span>⏰ {new Date(item.tolashMuddati).toLocaleDateString("uz-UZ")}</span>
                            </div>

                            {/* Sub-card info */}
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                  <i className="fas fa-tshirt text-gray-400 text-xs"></i>
                                  {item.mahsulot}
                                </h4>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Muddat: {remainingText}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-extrabold text-gray-900 block">
                                  {item.qarzMiqdori.toLocaleString()} so'm
                                </span>
                                <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full mt-1 ${statusColor}`}>
                                  {item.status}
                                </span>
                              </div>
                            </div>

                            {/* Sub-card actions */}
                            <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
                              {item.status !== "To'langan" && (
                                <button
                                  onClick={() => qarzniTolash(item.id)}
                                  className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded-full transition text-[11px] font-bold cursor-pointer"
                                >
                                  <i className="fas fa-check mr-1"></i>
                                  To'landi
                                </button>
                              )}
                              {currentUser?.role === "admin" && (
                                <>
                                  <button
                                    onClick={() => qarzniTahrirlash(item)}
                                    className="text-white bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded-full transition text-[11px] font-bold cursor-pointer"
                                  >
                                    <i className="fas fa-edit mr-1"></i>
                                    Tahrirlash
                                  </button>
                                  <button
                                    onClick={() => qarzniOchirish(item.id)}
                                    className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full transition text-[11px] font-bold cursor-pointer"
                                  >
                                    <i className="fas fa-trash mr-1"></i>
                                    O'chirish
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {groupedDebtsList.length === 0 && (
              <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                <i className="fas fa-search text-3xl mb-2 text-gray-300"></i>
                <p className="text-sm">Hech qanday qarz topilmadi</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-sm w-full p-5 text-center animate-slide-up border border-indigo-505">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500 text-xl animate-bounce">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1.5">Tasdiqlash</h3>
            <p className="text-xs text-gray-600 mb-5">{confirmModal.message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-full text-sm transition shadow-md cursor-pointer"
              >
                Ha, o'chirish
              </button>
              <button
                onClick={() => setConfirmModal({ isOpen: false, message: "", onConfirm: null })}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-5 py-2 rounded-full text-sm transition cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
