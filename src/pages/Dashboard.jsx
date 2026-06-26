import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import logo from "../assets/web-daftar.png";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // Form states
  const [mijozIsmi, setMijozIsmi] = useState("");
  const [telefon, setTelefon] = useState("");
  const [mahsulot, setMahsulot] = useState("Shim");
  const [customProduct, setCustomProduct] = useState("");
  const [qarzMiqdori, setQarzMiqdori] = useState("");
  const [sana, setSana] = useState("");
  const [tolashMuddati, setTolashMuddati] = useState("");

  // Edit and list states
  const [qarzlar, setQarzlar] = useState([]);
  const [tahrirlanayotganId, setTahrirlanayotganId] = useState(null);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sanaFilter, setSanaFilter] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  const dailyReportTimeoutRef = useRef(null);
  const qarzFormRef = useRef(null);

  // Authenticate & Load Initial Data
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

    // Schedule daily report
    scheduleDailyReport();

    return () => {
      if (dailyReportTimeoutRef.current) {
        clearTimeout(dailyReportTimeoutRef.current);
      }
    };
  }, [navigate]);

  // Format amount input as user types
  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/[^\d.]/g, "");
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }
    const num = parseFloat(value.replace(/,/g, ""));
    if (!isNaN(num)) {
      const formatted = num.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      setQarzMiqdori(formatted);
    } else {
      setQarzMiqdori(value);
    }
  };

  // Reset form
  const resetForm = () => {
    setMijozIsmi("");
    setTelefon("");
    setMahsulot("Shim");
    setCustomProduct("");
    setQarzMiqdori("");
    setSana("");
    setTolashMuddati("");
    setTahrirlanayotganId(null);
  };

  // Submit / Add or Edit Debt
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!mijozIsmi || !telefon || !mahsulot || !qarzMiqdori || !sana || !tolashMuddati) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }

    try {
      const finalProduct = mahsulot === "Boshqa" ? customProduct || "Boshqa" : mahsulot;
      const parsedAmount = parseFloat(qarzMiqdori.replace(/,/g, ""));

      const yangiMalumot = {
        mijozIsmi,
        telefon,
        mahsulot: finalProduct,
        qarzMiqdori: parsedAmount,
        sana,
        tolashMuddati,
        status: "To'lanmagan",
      };

      let updatedQarzlar;

      if (tahrirlanayotganId) {
        // Edit existing
        updatedQarzlar = qarzlar.map((q) =>
          q.id === tahrirlanayotganId ? { ...q, ...yangiMalumot } : q
        );
        toast.success("Qarz ma'lumotlari muvaffaqiyatli yangilandi!");

        const message = `🔄 <b>Qarz yangilandi</b>\n\n👤 Mijoz: ${
          yangiMalumot.mijozIsmi
        }\n📱 Telefon: ${yangiMalumot.telefon}\n👕 Mahsulot: ${
          yangiMalumot.mahsulot
        }\n💰 Qarz miqdori: ${yangiMalumot.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
          yangiMalumot.sana
        ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
          yangiMalumot.tolashMuddati
        ).toLocaleDateString()}`;
        sendTelegramMessage(message);
      } else {
        // Create new
        const newQarz = {
          id: Date.now(),
          ...yangiMalumot,
        };
        updatedQarzlar = [...qarzlar, newQarz];
        toast.success("Yangi qarz muvaffaqiyatli qo'shildi!");

        const message = `➕ <b>Yangi qarz qo'shildi</b>\n\n👤 Mijoz: ${
          yangiMalumot.mijozIsmi
        }\n📱 Telefon: ${yangiMalumot.telefon}\n👕 Mahsulot: ${
          yangiMalumot.mahsulot
        }\n💰 Qarz miqdori: ${yangiMalumot.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
          yangiMalumot.sana
        ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
          yangiMalumot.tolashMuddati
        ).toLocaleDateString()}`;
        sendTelegramMessage(message);
      }

      setQarzlar(updatedQarzlar);
      localStorage.setItem("qarzlar", JSON.stringify(updatedQarzlar));
      resetForm();
    } catch (error) {
      console.error("Xatolik yuz berdi:", error);
      toast.error("Ma'lumotlarni saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    }
  };

  // Start edit mode
  const qarzniTahrirlash = (qarz) => {
    setTahrirlanayotganId(qarz.id);
    setMijozIsmi(qarz.mijozIsmi);
    setTelefon(qarz.telefon);

    const presetProducts = ["Shim", "Ko'ylak", "Kurtka", "Kostyum-shim", "T-shirt"];
    if (presetProducts.includes(qarz.mahsulot)) {
      setMahsulot(qarz.mahsulot);
      setCustomProduct("");
    } else {
      setMahsulot("Boshqa");
      setCustomProduct(qarz.mahsulot);
    }

    setQarzMiqdori(qarz.qarzMiqdori.toLocaleString());
    setSana(qarz.sana);
    setTolashMuddati(qarz.tolashMuddati);

    qarzFormRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Mark as paid
  const qarzniTolash = (id) => {
    const updated = qarzlar.map((q) => {
      if (q.id === id) {
        const updatedDebt = { ...q, status: "To'langan" };
        
        const message = `✅ <b>Qarz to'landi</b>\n\n👤 Mijoz: ${
          updatedDebt.mijozIsmi
        }\n📱 Telefon: ${updatedDebt.telefon}\n👕 Mahsulot: ${
          updatedDebt.mahsulot
        }\n💰 Qarz miqdori: ${updatedDebt.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
          updatedDebt.sana
        ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
          updatedDebt.tolashMuddati
        ).toLocaleDateString()}`;
        sendTelegramMessage(message);

        return updatedDebt;
      }
      return q;
    });

    setQarzlar(updated);
    localStorage.setItem("qarzlar", JSON.stringify(updated));
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
      const message = `❌ <b>Qarz o'chirildi</b>\n\n👤 Mijoz: ${
        target.mijozIsmi
      }\n📱 Telefon: ${target.telefon}\n👕 Mahsulot: ${
        target.mahsulot
      }\n💰 Qarz miqdori: ${target.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
        target.sana
      ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
        target.tolashMuddati
      ).toLocaleDateString()}`;
      sendTelegramMessage(message);
    }

    setQarzlar(updated);
    localStorage.setItem("qarzlar", JSON.stringify(updated));
    toast.success("Qarz muvaffaqiyatli o'chirildi!");
    setConfirmModal({ isOpen: false, message: "", onConfirm: null });
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

      const caption = `📊 Qarzlar hisoboti\n\n📅 Sana va vaqt: ${bugun.toLocaleString(
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

  // Schedule daily report helper
  const scheduleDailyReport = () => {
    const now = new Date();
    const reportTime = new Date(now);
    reportTime.setHours(22, 0, 0, 0); // Set to 22:00

    if (now > reportTime) {
      reportTime.setDate(reportTime.getDate() + 1);
    }

    const timeUntilReport = reportTime - now;

    dailyReportTimeoutRef.current = setTimeout(async () => {
      try {
        await exportToExcel();
        console.log("Kunlik hisobot muvaffaqiyatli yuborildi!");
      } catch (error) {
        console.error("Kunlik hisobot yuborishda xatolik:", error);
      }
      scheduleDailyReport(); // Schedule for next day
    }, timeUntilReport);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    navigate("/login");
  };

  // Calculations for Stats
  const uniqueCustomersCount = new Set(qarzlar.map((q) => q.mijozIsmi)).size;
  const totalDebtAmount = qarzlar
    .filter((q) => q.status === "To'lanmagan")
    .reduce((sum, q) => sum + q.qarzMiqdori, 0);

  const today = new Date();
  const overdueCount = qarzlar.filter(
    (q) => new Date(q.tolashMuddati) < today && q.status === "To'lanmagan"
  ).length;

  // Filtered List
  const filteredQarzlar = qarzlar
    .filter((q) => {
      // Search search term
      const searchMatch =
        q.mijozIsmi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.telefon.includes(searchTerm) ||
        q.mahsulot.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Search date filter
      let dateMatch = true;
      if (sanaFilter) {
        const qarzSanaStr = new Date(q.sana).toISOString().split("T")[0];
        dateMatch = qarzSanaStr === sanaFilter;
      }

      return searchMatch && dateMatch;
    })
    .filter((q) => {
      // Filter Type
      if (filterType === "tolangan") return q.status === "To'langan";
      if (filterType === "tolanmagan") {
        return new Date(q.tolashMuddati) >= today && q.status === "To'lanmagan";
      }
      if (filterType === "muddatiOtgan") {
        return new Date(q.tolashMuddati) < today && q.status === "To'lanmagan";
      }
      return true; // "all"
    })
    .reverse(); // Newest first

  return (
    <div>
      <div className="main-background"></div>
      <div className="backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
          
          {/* Header section */}
          <div className="flex justify-between items-center mb-5 md:mb-8">
            <div className="flex items-center gap-1.5 md:gap-3 animate-fade-in">
              <img className="w-14 md:w-16 rounded-md md:rounded-xl mx-auto" src={logo} alt="Logo" />
              <div>
                <h1 className="text-lg sm:text-2xl md:text-4xl font-bold text-white">Kiyim Magazini</h1>
                <p className="text-gray-200 text-sm sm:text-base md:text-xl">Qarz Daftar Tizimi</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <Link
                to="/diagram"
                className="submit-button px-5 py-2.5 rounded-full shadow font-semibold text-white whitespace-nowrap bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 transition"
              >
                <i className="fas fa-chart-line mr-2"></i> Diagrama
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500/80 hover:bg-red-600 text-white font-semibold px-4 py-2.5 rounded-full shadow transition"
                title="Tizimdan chiqish"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-slide-up">
            <div className="hidden md:inline bg-white/80 backdrop-blur-md p-5 md:p-6 py-2 md:py-6 rounded-lg shadow-lg">
              <div className="flex items-center">
                <i className="fas fa-users text-3xl text-blue-500 mr-4"></i>
                <div>
                  <h3 className="text-xl font-semibold">Jami mijozlar</h3>
                  <p className="text-2xl font-bold text-blue-600">{uniqueCustomersCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-md p-5 md:p-6 py-2 md:py-6 rounded-lg shadow-lg">
              <div className="flex items-center">
                <i className="fas fa-money-bill-wave text-3xl text-green-500 mr-4"></i>
                <div>
                  <h3 className="text-xl font-semibold">Jami qarzlar</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {totalDebtAmount.toLocaleString()} so'm
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden md:inline bg-white/80 backdrop-blur-md p-5 md:p-6 py-2 md:py-6 rounded-lg shadow-lg">
              <div className="flex items-center">
                <i className="fas fa-clock text-3xl text-red-500 mr-4"></i>
                <div>
                  <h3 className="text-xl font-semibold">Muddati o'tgan</h3>
                  <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Yangi qarz qo'shish formasi */}
          <div
            ref={qarzFormRef}
            className="mx-auto my-5 md:my-8 bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-lg shadow-2xl animate-slide-up"
          >
            <div className="flex justify-center md:justify-start items-center mb-2 md:mb-6 mt-0 md:mt-2">
              <i className="fas fa-plus-circle text-2xl md:text-3xl text-blue-500 mr-1 md:mr-3"></i>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                {tahrirlanayotganId ? "Qarz Ma'lumotlarini Tahrirlash" : "Yangi Qarz Qo'shish"}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                
                {/* Mijoz ismi */}
                <div className="form-group relative">
                  <input
                    className="w-full p-2.5 rounded-full px-4 pl-10 bg-white/90 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    type="text"
                    value={mijozIsmi}
                    onChange={(e) => setMijozIsmi(e.target.value)}
                    placeholder="Mijoz ismini kiriting"
                    required
                  />
                  <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                </div>

                {/* Telefon raqami */}
                <div className="form-group relative">
                  <input
                    className="w-full p-2.5 rounded-full px-4 pl-10 bg-white/90 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    type="tel"
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                    placeholder="Telefon raqamini kiriting"
                    required
                  />
                  <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                </div>

                {/* Mahsulot nomi (select with default clothing values) */}
                <div className="form-group relative flex flex-col gap-2">
                  <div className="relative">
                    <select
                      className="w-full p-2.5 rounded-full px-4 pl-10 bg-white/90 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                      value={mahsulot}
                      onChange={(e) => setMahsulot(e.target.value)}
                      required
                    >
                      <option value="Shim">Shim</option>
                      <option value="Ko'ylak">Ko'ylak</option>
                      <option value="Kurtka">Kurtka</option>
                      <option value="Kostyum-shim">Kostyum-shim</option>
                      <option value="T-shirt">T-shirt</option>
                      <option value="Boshqa">Boshqa...</option>
                    </select>
                    <i className="fas fa-tshirt absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"></i>
                  </div>
                  
                  {mahsulot === "Boshqa" && (
                    <div className="relative mt-1 animate-slide-up">
                      <input
                        className="w-full p-2.5 rounded-full px-4 pl-10 bg-white/90 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none border-blue-200 border"
                        type="text"
                        value={customProduct}
                        onChange={(e) => setCustomProduct(e.target.value)}
                        placeholder="Mahsulot nomini kiriting"
                        required
                      />
                      <i className="fas fa-edit absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                    </div>
                  )}
                </div>

                {/* Qarz miqdori */}
                <div className="form-group relative">
                  <input
                    className="w-full p-2.5 rounded-full px-4 pl-10 bg-white/90 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    type="text"
                    value={qarzMiqdori}
                    onChange={handleAmountChange}
                    placeholder="Qarz miqdorini kiriting"
                    required
                  />
                  <i className="fas fa-money-bill-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                </div>

                {/* Sana */}
                <div className="form-group relative">
                  <input
                    className="w-full p-2.5 rounded-full px-4 pl-10 bg-white/90 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    type="date"
                    value={sana}
                    onChange={(e) => setSana(e.target.value)}
                    required
                  />
                  <i className="fas fa-calendar absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                </div>

                {/* To'lash muddati */}
                <div className="form-group relative">
                  <input
                    className="w-full p-2.5 rounded-full px-4 pl-10 bg-white/90 focus:bg-white transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    type="date"
                    value={tolashMuddati}
                    onChange={(e) => setTolashMuddati(e.target.value)}
                    required
                  />
                  <i className="fas fa-clock absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                </div>

              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className={`submit-button flex-1 py-3 rounded-full text-white font-semibold transition ${
                    tahrirlanayotganId ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-save"></i>
                    {tahrirlanayotganId ? "O'zgarishlarni saqlash" : "Qarzni saqlash"}
                  </span>
                </button>
                
                {tahrirlanayotganId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-8 py-3 rounded-full transition whitespace-nowrap"
                  >
                    Bekor qilish
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Qarzlar ro'yxati */}
          <div className="bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-lg shadow-lg animate-slide-up">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex items-center">
                <i className="fas fa-list text-2xl text-blue-500 mr-3"></i>
                <h2 className="text-xl font-semibold">Qarzlar Ro'yxati ({filteredQarzlar.length})</h2>
              </div>
              
              <div className="flex items-center gap-1.5 md:gap-4 w-full sm:w-auto mt-2 md:mt-0 whitespace-nowrap">
                <div className="search-box w-full sm:w-auto flex items-center bg-white border border-gray-300 rounded-full px-3 py-1.5">
                  <i className="fas fa-search text-gray-400 mr-2"></i>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Qidiruv..."
                    className="outline-none text-sm w-full bg-transparent"
                  />
                </div>
                
                <button
                  onClick={exportToExcel}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-full flex items-center justify-center font-semibold text-sm transition"
                >
                  <i className="fas fa-file-excel mr-2"></i>
                  <span>Excelga eksport</span>
                </button>
              </div>
            </div>

            {/* Filter tugmalari */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                onClick={() => setFilterType("all")}
                className={`filter-btn flex items-center justify-center sm:justify-start gap-2 px-2 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                  filterType === "all" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <i className="fas fa-list"></i>
                <span className="hidden sm:inline">Barchasi</span>
              </button>
              
              <button
                onClick={() => setFilterType("tolangan")}
                className={`filter-btn flex items-center justify-center sm:justify-start gap-2 px-2 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                  filterType === "tolangan" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <i className="fas fa-check"></i>
                <span className="hidden sm:inline">To'langan</span>
              </button>
              
              <button
                onClick={() => setFilterType("tolanmagan")}
                className={`filter-btn flex items-center justify-center sm:justify-start gap-2 px-2 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                  filterType === "tolanmagan" ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <i className="fas fa-clock"></i>
                <span className="hidden sm:inline">To'lanmagan</span>
              </button>
              
              <button
                onClick={() => setFilterType("muddatiOtgan")}
                className={`filter-btn flex items-center justify-center sm:justify-start gap-2 px-2 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                  filterType === "muddatiOtgan" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <i className="fas fa-exclamation-circle"></i>
                <span className="hidden sm:inline">Muddati o'tgan</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="table-header text-left px-4 py-3 whitespace-nowrap">Mijoz</th>
                    <th className="table-header text-left px-4 py-3 whitespace-nowrap">Telefon</th>
                    <th className="table-header text-left px-4 py-3 whitespace-nowrap">Mahsulot</th>
                    <th className="table-header text-left px-4 py-3 whitespace-nowrap">Qarz miqdori</th>
                    <th className="table-header text-left px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>Sana</span>
                        <input
                          type="date"
                          value={sanaFilter}
                          onChange={(e) => setSanaFilter(e.target.value)}
                          className="border border-gray-300 rounded px-1.5 py-0.5 text-xs text-black outline-none w-28 bg-white cursor-pointer"
                        />
                        {sanaFilter && (
                          <button
                            onClick={() => setSanaFilter("")}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-times-circle"></i>
                          </button>
                        )}
                      </div>
                    </th>
                    <th className="table-header text-left px-4 py-3 whitespace-nowrap">To'lash muddati</th>
                    <th className="table-header text-left px-4 py-3 whitespace-nowrap">Amallar</th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-200">
                  {filteredQarzlar.map((q) => {
                    const tolashDate = new Date(q.tolashMuddati);
                    const overdue = today > tolashDate && q.status === "To'lanmagan";
                    const remainingDays = Math.ceil((tolashDate - today) / (1000 * 60 * 60 * 24));

                    let remainingText = "";
                    if (q.status === "To'langan") {
                      remainingText = <span className="text-green-600">To'langan</span>;
                    } else if (overdue) {
                      remainingText = <span className="text-red-600 font-bold">{Math.abs(remainingDays)} kun o'tgan</span>;
                    } else if (remainingDays === 0) {
                      remainingText = <span className="text-yellow-600 font-bold">Bugun</span>;
                    } else {
                      remainingText = <span className="text-blue-600">{remainingDays} kun qoldi</span>;
                    }

                    const statusBadge =
                      q.status === "To'langan" ? (
                        <span className="px-2 py-0.5 text-xs font-semibold text-green-600 bg-green-100 rounded-full">
                          To'langan
                        </span>
                      ) : overdue ? (
                        <span className="px-2 py-0.5 text-xs font-semibold text-red-600 bg-red-100 rounded-full">
                          Muddati o'tgan
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold text-yellow-600 bg-yellow-100 rounded-full">
                          To'lanmagan
                        </span>
                      );

                    return (
                      <tr key={q.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-9 w-9 bg-gray-100 rounded-full flex items-center justify-center">
                              <i className="fas fa-user text-gray-500"></i>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{q.mijozIsmi}</div>
                              {statusBadge}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <a href={`tel:${q.telefon}`} className="text-sm text-blue-700 font-medium hover:underline flex items-center gap-1.5">
                            <i className="fas fa-phone text-blue-500 text-xs"></i>
                            {q.telefon}
                          </a>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900 flex items-center gap-1.5">
                            <i className="fas fa-tshirt text-gray-400 text-xs"></i>
                            {q.mahsulot}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-medium flex items-center gap-1.5">
                            <i className="fas fa-money-bill-alt text-gray-400 text-xs"></i>
                            {q.qarzMiqdori.toLocaleString()} so'm
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900 flex items-center gap-1.5">
                            <i className="fas fa-calendar text-gray-400 text-xs"></i>
                            {new Date(q.sana).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className={`text-sm ${overdue ? "text-red-600 font-bold" : "text-gray-900"}`}>
                            <div className="flex items-center gap-1.5">
                              <i className="fas fa-clock text-gray-400 text-xs"></i>
                              {new Date(q.tolashMuddati).toLocaleDateString()}
                            </div>
                            <div className="mt-0.5 text-xs font-medium">{remainingText}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {q.status !== "To'langan" && (
                              <button
                                onClick={() => qarzniTolash(q.id)}
                                className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded-md transition text-xs font-semibold"
                              >
                                <i className="fas fa-check mr-1"></i>
                                To'landi
                              </button>
                            )}
                            
                            {currentUser?.role === "admin" && (
                              <>
                                <button
                                  onClick={() => qarzniTahrirlash(q)}
                                  className="text-white bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded-md transition text-xs font-semibold"
                                >
                                  <i className="fas fa-edit mr-1"></i>
                                  Tahrirlash
                                </button>
                                <button
                                  onClick={() => qarzniOchirish(q.id)}
                                  className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md transition text-xs font-semibold"
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
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        <i className="fas fa-search text-4xl mb-2 text-gray-300"></i>
                        <p>Hech qanday qarz topilmadi</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-slide-up border border-indigo-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-2xl">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Tasdiqlash</h3>
            <p className="text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-full transition shadow-md cursor-pointer"
              >
                Ha, o'chirish
              </button>
              <button
                onClick={() => setConfirmModal({ isOpen: false, message: "", onConfirm: null })}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-2 rounded-full transition cursor-pointer"
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
