import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

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

  // Activity logger helper
  const addActivityLog = (text, type) => {
    try {
      const savedLogs = JSON.parse(localStorage.getItem("activity_logs")) || [];
      const newLog = {
        id: Date.now(),
        text,
        time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        type,
      };
      const updatedLogs = [...savedLogs, newLog].slice(-20);
      localStorage.setItem("activity_logs", JSON.stringify(updatedLogs));
      window.dispatchEvent(new Event("activity_logged"));
    } catch (e) {
      console.error("Log error", e);
    }
  };

  // Load Initial Data
  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }
    setCurrentUser(JSON.parse(userStr));

    // Load debts
    const savedQarzlar = JSON.parse(localStorage.getItem("qarzlar")) || [];
    setQarzlar(savedQarzlar);

    // Listen for storage updates (e.g. if updated from another tab or page)
    const handleStorageChange = () => {
      const updated = JSON.parse(localStorage.getItem("qarzlar")) || [];
      setQarzlar(updated);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate]);

  // Mark as paid
  const qarzniTolash = (id) => {
    const updated = qarzlar.map((q) => {
      if (q.id === id) {
        const updatedDebt = { ...q, status: "To'langan" };
        
        const message = `✅ <b>Qarz to'landi (Mobil)</b>\n\n👤 Mijoz: ${
          updatedDebt.mijozIsmi
        }\n📱 Telefon: ${updatedDebt.telefon}\n👕 Mahsulot: ${
          updatedDebt.mahsulot
        }\n💰 Qarz miqdori: ${updatedDebt.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
          updatedDebt.sana
        ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
          updatedDebt.tolashMuddati
        ).toLocaleDateString()}`;
        sendTelegramMessage(message);
        addActivityLog(`Qarz to'landi: ${q.mijozIsmi} (${q.qarzMiqdori.toLocaleString()} so'm)`, "pay");

        return updatedDebt;
      }
      return q;
    });

    setQarzlar(updated);
    localStorage.setItem("qarzlar", JSON.stringify(updated));
    toast.success("Qarz to'langan deb belgilandi!");
  };

  // Delete debt
  const qarzniOchirish = (id) => {
    setConfirmModal({
      isOpen: true,
      message: "Bu qarzni o'chirishni xohlaysizmi?",
      onConfirm: () => executeDelete(id),
    });
  };

  const executeDelete = (id) => {
    const target = qarzlar.find((q) => q.id === id);
    const updated = qarzlar.filter((q) => q.id !== id);

    if (target) {
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
      addActivityLog(`Qarz o'chirildi: ${target.mijozIsmi}`, "delete");
    }

    setQarzlar(updated);
    localStorage.setItem("qarzlar", JSON.stringify(updated));
    toast.success("Qarz muvaffaqiyatli o'chirildi!");
    setConfirmModal({ isOpen: false, message: "", onConfirm: null });
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

  return (
    <div>
      <div className="main-background"></div>
      <div className="backdrop-blur flex items-start justify-center p-4 min-h-screen pb-20">
        <div className="w-full max-w-4xl bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-2xl animate-slide-up">
          
          {/* Header & Back Button */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Orqaga"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="search-box flex items-center bg-white border border-gray-300 rounded-full px-4 py-2">
              <i className="fas fa-search text-gray-400 mr-2"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Mijoz, telefon yoki mahsulot bo'yicha qidiruv..."
                className="outline-none text-sm w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times-circle"></i>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2">
              <i className="fas fa-calendar text-gray-400"></i>
              <input
                type="date"
                value={sanaFilter}
                onChange={(e) => setSanaFilter(e.target.value)}
                className="outline-none text-sm w-full bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
              />
              {sanaFilter && (
                <button onClick={() => setSanaFilter("")} className="text-red-500 hover:text-red-700">
                  <i className="fas fa-times-circle"></i>
                </button>
              )}
            </div>
          </div>

          {/* Filter buttons */}
          <div className="grid grid-cols-4 gap-1.5 mb-4">
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
          <div className="overflow-x-auto rounded-xl border border-gray-200">
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
