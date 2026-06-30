import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";

export default function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPaymentView, setShowPaymentView] = useState(false);

  const openEditModal = () => {
    setNewUsername(currentUser?.username || "");
    setNewPassword("");
    setConfirmPassword("");
    setIsEditModalOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Parollar bir-biriga mos kelmadi!");
      return;
    }

    const res = await api.put("/users/profile", {
      username: newUsername.trim(),
      password: newPassword ? newPassword.trim() : undefined,
    });

    if (!res.error) {
      toast.success("Profil ma'lumotlari muvaffaqiyatli yangilandi!");
      
      const updatedUser = { ...currentUser, username: res.username };
      sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      setIsEditModalOpen(false);
    } else {
      toast.error(res.error);
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

    const loadProfileData = async () => {
      const logsRes = await api.get("/logs");
      if (!logsRes.error) {
        setLogs(logsRes);
      }
      const userRes = await api.get("/auth/me");
      if (!userRes.error) {
        setCurrentUser(prev => ({ ...prev, ...userRes }));
      }
    };

    loadProfileData();
  }, [navigate]);



  const getRemainingDays = (dateStr) => {
    if (!dateStr) return null;
    const expiryDate = new Date(dateStr);
    const today = new Date();
    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    toast.success("Tizimdan chiqildi!");
    navigate("/login");
  };

  const rem = currentUser?.subscriptionUntil ? getRemainingDays(currentUser.subscriptionUntil) : null;
  const paymentSublabel = rem !== null 
    ? (rem > 0 ? `${rem} kun qoldi` : rem === 0 ? "Bugun oxirgi kun!" : "Muddati tugagan!")
    : "Oylik to'lov va faollik muddati";

  const menuItems = [
    {
      icon: "fa-boxes",
      label: "Mahsulotlar va turlar",
      sublabel: "Mahsulot nomlarini tahrirlash va yangi turlar qo'shish",
      iconBg: "bg-indigo-100 text-indigo-600",
      action: () => navigate("/manage-products"),
    },
    {
      icon: "fa-bell",
      label: "Bildirishnomalar",
      sublabel: `${logs.length} ta faoliyat logi`,
      iconBg: "bg-yellow-100 text-yellow-600",
      action: () => navigate("/notifications"),
    },
    {
      icon: "fa-credit-card",
      label: "Ilova to'lovi (Tarif)",
      sublabel: paymentSublabel,
      iconBg: "bg-emerald-100 text-emerald-600",
      action: () => setShowPaymentView(true),
    },
  ];

  return (
    <div>
      <div className="main-background" />

      <div className="min-h-screen pb-24">



        <div className="px-4 pt-2 space-y-4">

          {showPaymentView ? (
            /* Subpage: Subscription & Payment Guide */
            <div className="space-y-4 animate-slide-up">
              {/* Back Button & Title Card */}
              <div className="glass-card-premium hover-shadow-blue rounded-3xl p-4 flex items-center gap-3">
                <button
                  onClick={() => setShowPaymentView(false)}
                  className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-600 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="Orqaga"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base leading-tight">Ilova to'lovi (Tarif)</h3>
                  <p className="text-slate-400 text-[10px] font-semibold mt-0.5">Faollik muddati va hisob holati</p>
                </div>
              </div>

              {/* Expiry / Days Left Card */}
              <div className="glass-card-premium hover-shadow-blue rounded-3xl p-5 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100/60 shadow-sm text-2xl">
                  <i className="fas fa-credit-card animate-pulse"></i>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hisobingiz holati</h4>
                  
                  {/* Status Badge */}
                  <div className="mt-2 flex items-center justify-center gap-2">
                    {currentUser?.isBlocked ? (
                      <span className="bg-red-100 text-red-600 border border-red-200 px-3 py-1 rounded-full text-xs font-bold">
                        Bloklangan
                      </span>
                    ) : rem !== null ? (
                      rem > 0 ? (
                        <span className="bg-emerald-100 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                          Faol ({rem} kun qoldi)
                        </span>
                      ) : rem === 0 ? (
                        <span className="bg-amber-100 text-amber-600 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                          Bugun oxirgi kun!
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-600 border border-red-200 px-3 py-1 rounded-full text-xs font-bold">
                          Muddati tugagan
                        </span>
                      )
                    ) : (
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold">
                        Cheksiz muddat
                      </span>
                    )}
                  </div>

                  {currentUser?.subscriptionUntil && (
                    <p className="text-slate-500 text-xs font-bold mt-2.5">
                      Amal qilish muddati: {new Date(currentUser.subscriptionUntil).toLocaleDateString("uz-UZ", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment instructions (Uzbek card copy layout) */}
              <div className="glass-card-premium hover-shadow-blue rounded-3xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">To'lov yo'riqnomasi</h4>
                
                <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                  Ilovadan foydalanishni davom ettirish uchun oylik tarif to'lovini amalga oshiring. To'lovni pastdagi karta raqamiga yuborib, chekni administratorga yuboring.
                </p>

                {/* Simulated Debit Card */}
                <div className="bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden space-y-4">
                  <div className="absolute right-4 top-4 text-slate-700 text-3xl font-extrabold opacity-25">Uzcard</div>
                  
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To'lov kartasi</div>
                  
                  <div className="text-lg font-mono font-bold tracking-widest text-slate-100">
                    8600 1404 1234 5678
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Karta egasi</div>
                      <div className="text-xs font-bold text-slate-200 uppercase">Alimardon Toshpulatov</div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("8600140412345678");
                        toast.success("Karta raqami nusxalandi!");
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <i className="far fa-copy"></i> Nusxalash
                    </button>
                  </div>
                </div>

                {/* Telegram action button */}
                <a
                  href="https://t.me/AlimardonToshpulatov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25 text-white font-extrabold py-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md cursor-pointer text-xs"
                >
                  <i className="fab fa-telegram-plane text-sm"></i>
                  Chekni telegram orqali yuborish
                </a>
              </div>
            </div>
          ) : (
            /* Main Profile List View */
            <>
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
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-blue-600">
                    <i className={`fas ${currentUser?.role === "admin" ? "fa-user-shield" : "fa-store"} text-[10px]`}></i>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {currentUser?.role === "admin" ? "Admin" : currentUser?.role === "seller" ? "Sotuvchi" : currentUser?.role || "user"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={openEditModal}
                  className="w-12 h-12 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100/60 cursor-pointer transition duration-200"
                  title="Profilni tahrirlash"
                >
                  <i className="fas fa-user-edit text-lg"></i>
                </button>
              </div>

              {/* Menu Items */}
              <div className="glass-card-premium hover-shadow-blue rounded-3xl p-2 animate-slide-up">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-slate-50/80 transition-all duration-300 cursor-pointer text-left border-b border-slate-100/60 last:border-b-0 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <i className={`fas ${item.icon} text-base`}></i>
                      </div>
                      <div>
                        <p className="text-slate-700 font-semibold text-sm transition-colors duration-200 group-hover:text-blue-600">{item.label}</p>
                        {item.sublabel && <p className="text-slate-400 text-xs mt-0.5 font-medium">{item.sublabel}</p>}
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-slate-300 text-xs flex-shrink-0 transition-transform duration-200 group-hover:text-blue-500"></i>
                  </button>
                ))}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 hover:shadow-red-500/25 text-white font-extrabold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_4px_15px_rgba(239,68,68,0.25)] hover:shadow-lg cursor-pointer animate-slide-up"
              >
                <i className="fas fa-sign-out-alt text-lg"></i>
                Tizimdan chiqish
              </button>
            </>
          )}

          {/* Edit Profile Modal */}
          {isEditModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="glass-card-premium max-w-md w-full p-6 rounded-3xl space-y-4 shadow-xl border border-white/60 bg-white/95 relative animate-slide-up">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <i className="fas fa-user-cog text-blue-500"></i>
                    Profilni tahrirlash
                  </h3>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg bg-slate-50 cursor-pointer"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {/* Username */}
                  <div className="form-group relative">
                    <label className="text-gray-700 font-semibold mb-1 text-sm block">Login (Foydalanuvchi nomi)</label>
                    <div className="relative">
                      <input
                        className="w-full glass-input"
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Yangi login kiriting"
                        required
                      />
                      <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="form-group relative">
                    <label className="text-gray-700 font-semibold mb-1 text-sm block">Yangi parol (ixtiyoriy)</label>
                    <div className="relative">
                      <input
                        className="w-full glass-input"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="O'zgartirish uchun yangi parol yozing"
                      />
                      <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  {newPassword && (
                    <div className="form-group relative animate-slide-up">
                      <label className="text-gray-700 font-semibold mb-1 text-sm block">Yangi parolni tasdiqlash</label>
                      <div className="relative">
                        <input
                          className="w-full glass-input"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Yangi parolni qayta yozing"
                          required
                        />
                        <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-check-circle"></i>
                      Saqlash
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-5 py-3 rounded-xl transition cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
