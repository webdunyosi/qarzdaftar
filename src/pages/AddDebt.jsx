import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

// Product suggestions helper based on seller business type
const getProductSuggestions = (type) => {
  switch (type) {
    case "Kiyim-kechak":
      return {
        products: ["Shim", "Ko'ylak", "Kurtka", "Kostyum-shim", "T-shirt"],
        icon: "fa-tshirt"
      };
    case "Oziq-ovqat":
      return {
        products: ["Guruch", "Yog'", "Shakar", "Un", "Choy", "Makaron"],
        icon: "fa-apple-alt"
      };
    case "Go'sht mahsulotlari (Tovuq)":
      return {
        products: ["Tovuq go'shti (Butun)", "Tovuq soni", "Tovuq filesi", "Tovuq qanoti", "Tovuq qiymasi"],
        icon: "fa-drumstick-bite"
      };
    case "Maishiy texnika":
      return {
        products: ["Muzlatgich", "Televizor", "Konditsioner", "Kir yuvish mashinasi", "Dazmol", "Changyutgich"],
        icon: "fa-tv"
      };
    default:
      return {
        products: ["Shim", "Ko'ylak", "Kurtka", "Kostyum-shim", "T-shirt"],
        icon: "fa-box"
      };
  }
};

const loadProductSuggestions = (type) => {
  const saved = localStorage.getItem(`product_suggestions_${type}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return getProductSuggestions(type);
};

export default function AddDebt() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get logged-in user synchronously to initialize states
  const loggedUser = (() => {
    try {
      const userStr = sessionStorage.getItem("currentUser");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  })();


  useEffect(() => {
    if (!loggedUser) {
      navigate("/login");
    }
  }, [loggedUser, navigate]);

  // Activity logger helper
  const addActivityLog = async (text, type) => {
    try {
      await api.post("/logs", { text, type });
    } catch (e) {
      console.error("Log error", e);
    }
  };

  // Form states
  const [mijozIsmi, setMijozIsmi] = useState("");
  const [telefon, setTelefon] = useState("");

  const suggestions = loadProductSuggestions(loggedUser?.type);
  const [mahsulot, setMahsulot] = useState(suggestions.products[0] || "Boshqa");
  const [customProduct, setCustomProduct] = useState("");
  const [qarzMiqdori, setQarzMiqdori] = useState("");
  const [sana, setSana] = useState("");
  const [tolashMuddati, setTolashMuddati] = useState("");

  const [tahrirlanayotganId, setTahrirlanayotganId] = useState(null);

  // Load editing debt data if passed via location state
  useEffect(() => {
    if (location.state?.editDebt) {
      const qarz = location.state.editDebt;
      setTahrirlanayotganId(qarz.id);
      setMijozIsmi(qarz.mijozIsmi);
      setTelefon(qarz.telefon);

      const userSuggestions = loadProductSuggestions(loggedUser?.type);
      const presetProducts = userSuggestions.products;
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
    } else if (location.state?.prefill) {
      const { mijozIsmi, telefon } = location.state.prefill;
      setMijozIsmi(mijozIsmi);
      setTelefon(telefon);
    }
  }, [location, loggedUser]);

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

  // Submit / Add or Edit Debt
  const handleSubmit = async (e) => {
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
      };

      if (tahrirlanayotganId) {
        // Edit existing
        const res = await api.put(`/debts/${tahrirlanayotganId}`, yangiMalumot);
        if (res.error) {
          toast.error(res.error);
          return;
        }

        toast.success("Qarz ma'lumotlari muvaffaqiyatli yangilandi!");
        await addActivityLog(`Qarz yangilandi: ${mijozIsmi} (${parsedAmount.toLocaleString()} so'm)`, "edit");

        const message = `🔄 <b>Qarz yangilandi (Mobil)</b>\n\n👤 Mijoz: ${
          res.mijozIsmi
        }\n📱 Telefon: ${res.telefon}\n👕 Mahsulot: ${
          res.mahsulot
        }\n💰 Qarz miqdori: ${res.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
          res.sana
        ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
          res.tolashMuddati
        ).toLocaleDateString()}`;
        sendTelegramMessage(message);
      } else {
        // Create new
        const res = await api.post("/debts", yangiMalumot);
        if (res.error) {
          toast.error(res.error);
          return;
        }

        toast.success("Yangi qarz muvaffaqiyatli qo'shildi!");
        await addActivityLog(`Yangi qarz qo'shildi: ${mijozIsmi} (${parsedAmount.toLocaleString()} so'm)`, "add");

        const message = `➕ <b>Yangi qarz qo'shildi (Mobil)</b>\n\n👤 Mijoz: ${
          res.mijozIsmi
        }\n📱 Telefon: ${res.telefon}\n👕 Mahsulot: ${
          res.mahsulot
        }\n💰 Qarz miqdori: ${res.qarzMiqdori.toLocaleString()} so'm\n📅 Sana: ${new Date(
          res.sana
        ).toLocaleDateString()}\n⏰ To'lash muddati: ${new Date(
          res.tolashMuddati
        ).toLocaleDateString()}`;
        sendTelegramMessage(message);
      }

      navigate("/");
    } catch (error) {
      console.error("Xatolik yuz berdi:", error);
      toast.error("Ma'lumotlarni saqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    }
  };

  return (
    <div>
      <div className="main-background"></div>
      <div className="backdrop-blur flex items-center justify-center p-4 min-h-screen pb-20">
        <div className="w-full max-w-lg glass-card-premium hover-shadow-blue p-6 sm:p-8 rounded-3xl animate-slide-up">
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {tahrirlanayotganId ? "Qarzni Tahrirlash" : "Yangi Qarz Qo'shish"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mijoz ismi */}
            <div className="form-group relative">
              <label className="text-gray-700 font-semibold mb-1 text-sm block">Mijoz Ismi</label>
              <div className="relative">
                <input
                  className="w-full glass-input"
                  type="text"
                  value={mijozIsmi}
                  onChange={(e) => setMijozIsmi(e.target.value)}
                  placeholder="Mijoz ismini kiriting"
                  required
                />
                <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
              </div>
            </div>

            {/* Telefon raqami */}
            <div className="form-group relative">
              <label className="text-gray-700 font-semibold mb-1 text-sm block">Telefon Raqami</label>
              <div className="relative">
                <input
                  className="w-full glass-input"
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="Telefon raqamini kiriting"
                  required
                />
                <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
              </div>
            </div>

            {/* Mahsulot nomi (select with default dynamic values based on seller type) */}
            <div className="form-group relative flex flex-col gap-2">
              <label className="text-gray-700 font-semibold mb-1 text-sm block">Mahsulot Nomi</label>
              <div className="relative">
                <select
                  className="w-full glass-input appearance-none"
                  value={mahsulot}
                  onChange={(e) => setMahsulot(e.target.value)}
                  required
                >
                  {suggestions.products.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="Boshqa">Boshqa...</option>
                </select>
                <i className={`fas ${suggestions.icon} absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none`}></i>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"></i>
              </div>
              
              {mahsulot === "Boshqa" && (
                <div className="relative mt-1 animate-slide-up">
                  <input
                    className="w-full glass-input"
                    type="text"
                    value={customProduct}
                    onChange={(e) => setCustomProduct(e.target.value)}
                    placeholder="Mahsulot nomini kiriting"
                    required
                  />
                  <i className="fas fa-edit absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"></i>
                </div>
              )}
            </div>

            {/* Qarz miqdori */}
            <div className="form-group relative">
              <label className="text-gray-700 font-semibold mb-1 text-sm block">Qarz Miqdori (so'm)</label>
              <div className="relative">
                <input
                  className="w-full glass-input"
                  type="text"
                  value={qarzMiqdori}
                  onChange={handleAmountChange}
                  placeholder="Qarz miqdorini kiriting"
                  required
                />
                <i className="fas fa-money-bill-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
              </div>
            </div>

            {/* Sana */}
            <div className="form-group relative">
              <label className="text-gray-700 font-semibold mb-1 text-sm block">Sana</label>
              <div className="relative">
                <input
                  className="w-full glass-input"
                  type="date"
                  value={sana}
                  onChange={(e) => setSana(e.target.value)}
                  required
                />
                <i className="fas fa-calendar absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
              </div>
            </div>

            {/* To'lash muddati */}
            <div className="form-group relative">
              <label className="text-gray-700 font-semibold mb-1 text-sm block">To'lash Muddati</label>
              <div className="relative">
                <input
                  className="w-full glass-input"
                  type="date"
                  value={tolashMuddati}
                  onChange={(e) => setTolashMuddati(e.target.value)}
                  required
                />
                <i className="fas fa-clock absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                className={`flex-1 py-3 rounded-xl text-white font-semibold transition active:scale-95 shadow-md cursor-pointer ${
                  tahrirlanayotganId ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-save"></i>
                  {tahrirlanayotganId ? "O'zgarishlarni saqlash" : "Qarzni saqlash"}
                </span>
              </button>
              
              <button
                type="button"
                onClick={() => navigate("/")}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl transition active:scale-95 cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
