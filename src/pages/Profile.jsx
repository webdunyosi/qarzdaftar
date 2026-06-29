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
    };

    loadProfileData();
  }, [navigate]);



  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    toast.success("Tizimdan chiqildi!");
    navigate("/login");
  };

  const menuItems = [
    {
      icon: "fa-bell",
      label: "Bildirishnomalar",
      sublabel: `${logs.length} ta faoliyat logi`,
      iconBg: "bg-yellow-100 text-yellow-600",
      action: () => navigate("/notifications"),
    },
  ];

  return (
    <div>
      <div className="main-background" />

      <div className="min-h-screen pb-24">



        <div className="px-4 pt-2 space-y-4">

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
              <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mt-0.5">
                {currentUser?.role === "admin" ? "Tizim Administratori" : "Operator / Foydalanuvchi"}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-blue-600">
                <i className="fas fa-shield-alt text-[9px]"></i>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {currentUser?.role || "user"}
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
                    {item.desc && <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>}
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
