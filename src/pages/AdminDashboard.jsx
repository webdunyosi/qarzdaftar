import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";
export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // Lists loaded from localStorage
  const [users, setUsers] = useState([]);
  const [qarzlar, setQarzlar] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  
  // New/Edit Seller Form state
  const [sellerUsername, setSellerUsername] = useState("");
  const [sellerPassword, setSellerPassword] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  
  // Category management and seller type state
  const [sellerTypes, setSellerTypes] = useState([]);
  const [sellerType, setSellerType] = useState("");
  const [editType, setEditType] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState("add_seller");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Barchasi");
  
  // Notification form state
  const [notificationText, setNotificationText] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  
  // Admin own profile change state
  const [adminUsername, setAdminUsername] = useState("Admin");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Load data
  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }
    const loggedUser = JSON.parse(userStr);
    if (loggedUser.role !== "admin") {
      navigate("/");
      return;
    }
    setAdminUsername(loggedUser.username);
    
    // Load lists from localStorage
    loadAllData();
  }, [navigate]);
  
  const loadAllData = async () => {
    setLoading(true);
    // Users list
    const usersRes = await api.get("/users");
    if (!usersRes.error) {
      setUsers(usersRes);
    }
    
    // Debts list
    const debtsRes = await api.get("/debts");
    if (!debtsRes.error) {
      setQarzlar(debtsRes);
    }
    
    // Broadcast notifications (from activity_logs where seller is null/global)
    const logsRes = await api.get("/logs");
    if (!logsRes.error) {
      const globalBroadcasts = logsRes.filter(log => log.type === "broadcast" || !log.seller);
      setBroadcasts(globalBroadcasts);
    }

    // Load seller types (categories)
    const typesRes = await api.get("/seller-types");
    if (!typesRes.error) {
      setSellerTypes(typesRes);
      if (typesRes.length > 0 && !sellerType) {
        setSellerType(typesRes[0]);
      }
    }
    setLoading(false);
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    if (sellerTypes.includes(newTypeName.trim())) {
      toast.error("Bunday tur allaqachon mavjud!");
      return;
    }
    
    const res = await api.post("/seller-types", { name: newTypeName.trim() });
    if (res.error) {
      toast.error(res.error);
      return;
    }
    
    toast.success("Yangi tur qo'shildi!");
    setNewTypeName("");
    loadAllData();
  };

  const handleDeleteType = async (typeToDelete) => {
    if (window.confirm(`"${typeToDelete}" turini o'chirib tashlamoqchimisiz?`)) {
      const res = await api.delete(`/seller-types/${typeToDelete}`);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Sotuvchi turi o'chirildi!");
      loadAllData();
    }
  };
  
  // Add new seller
  const handleAddSeller = async (e) => {
    e.preventDefault();
    if (!sellerUsername.trim() || !sellerPassword.trim()) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }
    
    const targetType = sellerType || (sellerTypes[0] || "Kiyim-kechak");
    const res = await api.post("/users", {
      username: sellerUsername.trim(),
      password: sellerPassword.trim(),
      type: targetType,
    });

    if (res.error) {
      toast.error(res.error);
      return;
    }
    
    setSellerUsername("");
    setSellerPassword("");
    toast.success("Yangi sotuvchi muvaffaqiyatli qo'shildi!");
    loadAllData();
  };
  
  // Save edited seller username/password
  const handleSaveSellerEdit = async (e) => {
    e.preventDefault();
    if (!editUsername.trim() || !editPassword.trim()) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }
    
    const res = await api.put(`/users/${editingUserId}`, {
      username: editUsername.trim(),
      password: editPassword.trim(),
      type: editType,
    });

    if (res.error) {
      toast.error(res.error);
      return;
    }
    
    setEditingUserId(null);
    toast.success("Sotuvchi ma'lumotlari muvaffaqiyatli tahrirlandi!");
    loadAllData();
  };
  
  // Delete seller
  const handleDeleteSeller = async (username) => {
    if (username.toLowerCase() === "admin") {
      toast.error("Admin hisobini o'chirib bo'lmaydi!");
      return;
    }
    
    if (window.confirm(`${username} sotuvchini tizimdan butunlay o'chirib tashlamoqchimisiz?`)) {
      const res = await api.delete(`/users/${username}`);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Sotuvchi muvaffaqiyatli o'chirildi!");
      loadAllData();
    }
  };
  
  // Send Broadcast notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationText.trim()) {
      toast.error("Iltimos, bildirishnoma matnini kiriting!");
      return;
    }
    
    const res = await api.post("/logs", {
      text: `📢 ${notificationText.trim()}`,
      type: notificationType,
      seller: null // global/broadcasted to all
    });

    if (res.error) {
      toast.error(res.error);
      return;
    }
    
    setNotificationText("");
    toast.success("Bildirishnoma barcha sotuvchilarga yuborildi!");
    loadAllData();
  };
  
  // Change Admin Profile
  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) {
      toast.error("Iltimos, login va parolni kiriting!");
      return;
    }
    
    const res = await api.put("/users/profile", {
      username: adminUsername.trim(),
      password: adminPassword.trim(),
    });

    if (res.error) {
      toast.error(res.error);
      return;
    }
    
    // Update currentUser in session
    sessionStorage.setItem("currentUser", JSON.stringify({
      username: res.username,
      role: "admin"
    }));
    setAdminPassword("");
    toast.success("Admin ma'lumotlari muvaffaqiyatli o'zgartirildi!");
    
    // Reload layout to reflect new username in the header immediately
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    toast.success("Tizimdan chiqildi!");
    navigate("/login");
  };
  
  // Get stats for a specific seller
  const getSellerStats = (username) => {
    const sellerDebts = qarzlar.filter(q => (q.seller || "Marjona") === username);
    const totalAmount = sellerDebts.reduce((sum, q) => sum + Number(q.qarzMiqdori || 0), 0);
    const paidAmount = sellerDebts.filter(q => q.status === "To'langan").reduce((sum, q) => sum + Number(q.qarzMiqdori || 0), 0);
    const activeAmount = sellerDebts.filter(q => q.status !== "To'langan").reduce((sum, q) => sum + Number(q.qarzMiqdori || 0), 0);
    
    return {
      count: sellerDebts.length,
      totalAmount,
      paidAmount, // Seller's Revenue / Daromadi
      activeAmount
    };
  };

  // Global aggregate stats
  const totalSystemDebts = qarzlar.reduce((sum, q) => sum + Number(q.qarzMiqdori || 0), 0);
  const totalSystemRevenue = qarzlar.filter(q => q.status === "To'langan").reduce((sum, q) => sum + Number(q.qarzMiqdori || 0), 0);
  const totalActiveDebts = qarzlar.filter(q => q.status !== "To'langan").reduce((sum, q) => sum + Number(q.qarzMiqdori || 0), 0);
  const totalSellersCount = users.filter(u => u.role === "seller").length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Tab Content 0: Bosh sahifa (Dashboard overview) */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-slide-up">
            
            {/* Global Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {loading ? (
                [
                  { bg: "bg-blue-50/85 border border-blue-100/70" },
                  { bg: "bg-green-50/85 border border-green-100/70" },
                  { bg: "bg-yellow-50/85 border border-yellow-100/70" },
                  { bg: "bg-indigo-50/85 border border-indigo-100/70" }
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} backdrop-blur-md p-5 rounded-3xl shadow-md animate-pulse`}>
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-9 h-9 bg-slate-200/50 rounded-xl skeleton-dark-premium" />
                      <div className="h-3 w-16 bg-slate-200/50 rounded skeleton-dark-premium" />
                    </div>
                    <div className="h-8 w-28 bg-slate-200/70 rounded skeleton-dark-premium" />
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md p-5 rounded-3xl shadow-md">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                        <i className="fas fa-store text-base"></i>
                      </div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sotuvchilar</p>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{totalSellersCount} ta</p>
                  </div>
                  
                  <div className="bg-green-50/85 border border-green-100/70 backdrop-blur-md p-5 rounded-3xl shadow-md">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-9 h-9 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shadow-sm">
                        <i className="fas fa-hand-holding-usd text-base"></i>
                      </div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Jami Daromad</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-green-600">
                      {totalSystemRevenue.toLocaleString()} <span className="text-sm font-semibold">so'm</span>
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50/85 border border-yellow-100/70 backdrop-blur-md p-5 rounded-3xl shadow-md">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-9 h-9 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center shadow-sm">
                        <i className="fas fa-file-invoice-dollar text-base"></i>
                      </div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Faol Qarzlar</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-yellow-600">
                      {totalActiveDebts.toLocaleString()} <span className="text-sm font-semibold">so'm</span>
                    </p>
                  </div>
                  
                  <div className="bg-indigo-50/85 border border-indigo-100/70 backdrop-blur-md p-5 rounded-3xl shadow-md">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                        <i className="fas fa-coins text-base"></i>
                      </div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Jami Ayblov</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-indigo-600">
                      {totalSystemDebts.toLocaleString()} <span className="text-sm font-semibold">so'm</span>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Quick overview of latest activity logs / broadcasts */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-history text-blue-600"></i>
                Oxirgi bildirishnomalar tarixi
              </h3>
              <div className="divide-y divide-slate-50 max-h-[250px] overflow-y-auto pr-1">
                {broadcasts.length === 0 ? (
                  <p className="text-slate-400 text-xs p-4 text-center">Yuborilgan bildirishnomalar mavjud emas</p>
                ) : (
                  [...broadcasts].reverse().slice(0, 5).map((b) => (
                    <div key={b.id} className="py-3 flex items-start justify-between gap-3 group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                          <i className="fas fa-bullhorn"></i>
                        </div>
                        <p className="font-semibold text-slate-700 text-sm">{b.text}</p>
                      </div>
                      <span className="text-slate-400 text-[10px] whitespace-nowrap mt-1 font-semibold">{b.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}



        {/* Tab Content 1: Sellers Management */}
        {activeTab === "sellers" && (
          <div className="space-y-6">
            
            {/* Search and filter row styled like Image 1 */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs"
                />
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              </div>

              <div className="relative w-28 sm:w-40 flex-shrink-0">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs appearance-none cursor-pointer"
                >
                  <option value="Barchasi">Barchasi</option>
                  {sellerTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
              </div>

              <button
                onClick={() => {
                  setModalTab("add_seller");
                  setShowAddModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 sm:px-4 rounded-xl font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 text-xs shrink-0"
              >
                <i className="fas fa-user-plus text-xs"></i> <span>Qo'shish</span>
              </button>
            </div>

            {/* Editing seller modal overlay */}
            {editingUserId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white border border-blue-100 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-scale-up">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Sotuvchi ma'lumotlarini o'zgartirish</h3>
                  <form onSubmit={handleSaveSellerEdit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Login</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Yangi Parol</label>
                      <input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Sotuvchi turi</label>
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
                      >
                        {sellerTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingUserId(null)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition"
                      >
                        Bekor qilish
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-md"
                      >
                        Saqlash
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Add Seller / Categories tabless Modal */}
            {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white border border-blue-100 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-scale-up relative">
                  
                  {/* Close button */}
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                  >
                    <i className="fas fa-times"></i>
                  </button>

                  {/* Add Seller form directly (Image 2 style) */}
                  {modalTab === "add_seller" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <i className="fas fa-user-plus text-blue-600"></i>
                        Yangi Sotuvchi Qo'shish
                      </h3>
                      <form onSubmit={(e) => {
                        handleAddSeller(e);
                        setShowAddModal(false);
                      }} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                            Sotuvchi logini (ism)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Sotuvchi logini (ism)..."
                              value={sellerUsername}
                              onChange={(e) => setSellerUsername(e.target.value)}
                              className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
                              required
                            />
                            <i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                            Sotuvchi paroli
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Sotuvchi paroli..."
                              value={sellerPassword}
                              onChange={(e) => setSellerPassword(e.target.value)}
                              className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
                              required
                            />
                            <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                            Sotuvchi turi / Do'kon sohasi
                          </label>
                          <div className="relative">
                            <select
                              value={sellerType}
                              onChange={(e) => setSellerType(e.target.value)}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm cursor-pointer appearance-none"
                            >
                              {sellerTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                              {sellerTypes.length === 0 && (
                                <option value="">Turlar mavjud emas</option>
                              )}
                            </select>
                            <i className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-md shadow-blue-500/10 cursor-pointer mt-4"
                        >
                          Sotuvchini qo'shish
                        </button>
                      </form>
                      <div className="text-center pt-3 border-t border-slate-100 mt-4">
                        <button
                          type="button"
                          onClick={() => setModalTab("manage_types")}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                        >
                          Do'kon sohalarini boshqarish
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manage Types list directly */}
                  {modalTab === "manage_types" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <i className="fas fa-tags text-blue-600"></i>
                        Do'kon Sohalari
                      </h3>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                          Mavjud do'kon sohalari
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[100px] max-h-[180px] overflow-y-auto">
                          {sellerTypes.length === 0 ? (
                            <p className="text-slate-400 text-xs p-2">Turlar yaratilmagan</p>
                          ) : (
                            sellerTypes.map((type) => (
                              <span
                                key={type}
                                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm"
                              >
                                {type}
                                <button
                                  onClick={() => handleDeleteType(type)}
                                  className="text-blue-500 hover:text-red-600 font-bold ml-0.5 cursor-pointer text-[10px]"
                                  title="O'chirish"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                      <form onSubmit={handleAddType} className="space-y-2 pt-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                          Yangi soha qo'shish
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Yangi tur nomi..."
                            value={newTypeName}
                            onChange={(e) => setNewTypeName(e.target.value)}
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
                          />
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl font-bold transition shadow-md cursor-pointer flex items-center justify-center"
                          >
                            <i className="fas fa-plus mr-1"></i> Qo'shish
                          </button>
                        </div>
                      </form>
                      <div className="text-center pt-3 border-t border-slate-100 mt-4">
                        <button
                          type="button"
                          onClick={() => setModalTab("add_seller")}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                        >
                          <i className="fas fa-arrow-left mr-1"></i> Sotuvchi qo'shish oynasiga qaytish
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Sellers List section (Styled as Image 1) */}
            <div className="space-y-4">
              {(() => {
                const filtered = users
                  .filter(u => u.role === "seller")
                  .filter(u => {
                    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesType = selectedType === "Barchasi" || u.type === selectedType;
                    return matchesSearch && matchesType;
                  });
                
                if (filtered.length === 0) {
                  return (
                    <div className="bg-white border border-slate-100 p-8 rounded-2xl text-center shadow-sm">
                      <p className="text-slate-400 font-medium">Mos keladigan sotuvchilar topilmadi.</p>
                    </div>
                  );
                }

                return filtered.map((u) => {
                  const stats = getSellerStats(u.username);
                  return (
                    <div 
                      key={u.username} 
                      className="bg-white border border-slate-100 border-l-4 border-l-blue-600 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col gap-4"
                    >
                      {/* Avatar & Details Row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg border border-blue-100 uppercase">
                            {u.username[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-base">{u.username}</h3>
                            <p className="text-slate-400 text-xs font-semibold mt-0.5">
                              A'zo bo'ldi: {u.createdAt ? new Date(u.createdAt).toLocaleDateString("uz-UZ") : new Date().toLocaleDateString("uz-UZ")}
                            </p>
                          </div>
                        </div>
                        
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Faol
                        </span>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-slate-50/70 border border-slate-100 rounded-xl text-center">
                        <div>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Jami qarzlar</p>
                          <p className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5">
                            {stats.count} ta ({stats.totalAmount.toLocaleString()} so'm)
                          </p>
                        </div>
                        <div className="border-x border-slate-200/60">
                          <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Daromad (Paid)</p>
                          <p className="font-bold text-emerald-600 text-xs sm:text-sm mt-0.5">
                            {stats.paidAmount.toLocaleString()} so'm
                          </p>
                        </div>
                        <div>
                          <p className="text-amber-600 text-[10px] font-bold uppercase tracking-wider">Faol qarzlar</p>
                          <p className="font-bold text-amber-600 text-xs sm:text-sm mt-0.5">
                            {stats.activeAmount.toLocaleString()} so'm
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions & Modify Panel */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-50">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`https://t.me/${u.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95"
                          >
                            <i className="fab fa-telegram-plane"></i> Telegram
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(u.password);
                              toast.success("Sotuvchi paroli nusxalandi!");
                            }}
                            className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                            title="Parolni nusxalash"
                          >
                            <i className="fas fa-key"></i> Parol: {u.password}
                          </button>
                          {u.type && (
                            <span className="inline-flex items-center gap-1.5 bg-blue-50/50 text-blue-700 px-3.5 py-2 rounded-xl text-xs font-bold border border-blue-100/40">
                              <i className="fas fa-store"></i> {u.type}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            onClick={() => {
                              setEditingUserId(u.username);
                              setEditUsername(u.username);
                              setEditPassword(u.password);
                              setEditType(u.type || (sellerTypes[0] || "Kiyim-kechak"));
                            }}
                            className="w-9 h-9 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center transition border border-blue-100/40 cursor-pointer"
                            title="Tahrirlash"
                          >
                            <i className="fas fa-pen text-sm"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteSeller(u.username)}
                            className="w-9 h-9 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center transition border border-red-200/40 cursor-pointer"
                            title="O'chirish"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

          </div>
        )}

        {/* Tab Content 2: All Debts View */}
        {activeTab === "all_debts" && (
          <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-5 shadow-md">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <i className="fas fa-database text-blue-600"></i>
              Barcha Sotuvchilarning Qarzlar Ro'yxati ({qarzlar.length})
            </h2>

            {qarzlar.length === 0 ? (
              <p className="text-slate-500 text-center py-6">Qarzlar kiritilmagan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-100/60">
                  <thead className="bg-white/70">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mijoz</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Sotuvchi</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mahsulot</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Miqdor</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Sana</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Muddati</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/40 divide-y divide-blue-50/40 font-medium text-slate-700 text-sm">
                    {qarzlar.map((q) => (
                      <tr key={q.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{q.mijozIsmi}</p>
                          <p className="text-slate-400 text-xs">{q.telefon || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100/70 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold capitalize">
                            {q.seller || "Marjona"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{q.mahsulot}</td>
                        <td className="px-4 py-3 text-slate-800 font-bold">
                          {Number(q.qarzMiqdori || q.miqdor || 0).toLocaleString()} so'm
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(q.sana).toLocaleDateString("uz-UZ")}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(q.tolashMuddati).toLocaleDateString("uz-UZ")}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            q.status === "To'langan" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Send Notification */}
        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Form */}
            <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-5 shadow-md md:col-span-2">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-bullhorn text-blue-600"></i>
                Sotuvchilarga Bildirishnoma Yuborish
              </h2>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Xabar turi</label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value)}
                    className="w-full p-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold appearance-none cursor-pointer"
                  >
                    <option value="info">Info (Ko'k)</option>
                    <option value="pay">Muvaffaqiyatli (Yashil)</option>
                    <option value="edit">Ogohlantirish (Sariq)</option>
                    <option value="delete">Muhim / Xavf (Qizil)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Xabar matni</label>
                  <textarea
                    rows="4"
                    placeholder="Bildirishnoma matnini yozing..."
                    value={notificationText}
                    onChange={(e) => setNotificationText(e.target.value)}
                    className="w-full p-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold resize-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition active:scale-95 cursor-pointer shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-paper-plane"></i>
                  Bildirishnomani tarqatish (Send)
                </button>
              </form>
            </div>

            {/* Previously sent history */}
            <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-5 shadow-md">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-history text-blue-600"></i>
                Oxirgi yuborilganlar
              </h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {broadcasts.length === 0 ? (
                  <p className="text-slate-400 text-center py-6 text-sm">Xabarlar yuborilmagan.</p>
                ) : (
                  [...broadcasts].reverse().slice(0, 10).map((b) => (
                    <div key={b.id} className="bg-white/80 border border-blue-100/40 p-3 rounded-xl text-xs shadow-sm">
                      <p className="font-semibold text-slate-700">{b.text}</p>
                      <p className="text-slate-400 text-[10px] text-right mt-1.5">{b.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        )}

        {/* Tab Content 4: Admin own profile change */}
        {activeTab === "settings" && (
          <div className="max-w-md mx-auto space-y-5 animate-slide-up pb-10">
            {/* Header: Shaxsiy Kabinet */}
            <h1 className="text-2xl font-black text-center text-slate-800 tracking-tight py-2">
              Shaxsiy Kabinet
            </h1>

            {/* Profile Card */}
            <div className="bg-white border border-slate-100/80 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Rounded avatar with blue/indigo gradient */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 relative">
                    <i className="fas fa-user-shield text-2xl"></i>
                    {/* Active green tick indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] text-white">
                      <i className="fas fa-check"></i>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg capitalize leading-tight">
                      {adminUsername || "Admin"}
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold mt-0.5">
                      +998 (90) 123-45-67
                    </p>
                    <div className="mt-1.5">
                      <span className="bg-blue-50 text-blue-600 border border-blue-100/50 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                        Super Admin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Toggle Icon Button */}
                <button
                  onClick={() => setShowEditForm(!showEditForm)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition cursor-pointer ${
                    showEditForm 
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10" 
                      : "bg-slate-50 border-slate-200/60 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                  title="Tahrirlash"
                >
                  <i className="fas fa-edit text-sm"></i>
                </button>
              </div>

              {/* Collapsible Edit form */}
              {showEditForm && (
                <div className="mt-5 pt-5 border-t border-slate-100 animate-slide-down">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Profilni Tahrirlash</h4>
                  <form onSubmit={handleUpdateAdminProfile} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Admin Logini</label>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Yangi Parol</label>
                      <input
                        type="password"
                        placeholder="Yangi admin parolini kiriting"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition active:scale-95 cursor-pointer shadow-md shadow-blue-500/10 text-sm"
                    >
                      O'zgarishlarni saqlash
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Navigation / Control Card */}
            <div className="bg-white border border-slate-100/80 rounded-3xl p-2 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
              <div className="divide-y divide-slate-50">
                <button
                  onClick={() => setSearchParams({ tab: "dashboard" })}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/50 rounded-2xl transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-colors group-hover:bg-indigo-100">
                      <i className="fas fa-chart-pie text-sm"></i>
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Bosh sahifa (Statistika)</span>
                  </div>
                  <i className="fas fa-chevron-right text-xs text-slate-300 transition-transform group-hover:translate-x-1"></i>
                </button>
                <button
                  onClick={() => setSearchParams({ tab: "sellers" })}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/50 rounded-2xl transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-100">
                      <i className="fas fa-users text-sm"></i>
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Sotuvchilar boshqaruvi</span>
                  </div>
                  <i className="fas fa-chevron-right text-xs text-slate-300 transition-transform group-hover:translate-x-1"></i>
                </button>
                <button
                  onClick={() => setSearchParams({ tab: "all_debts" })}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/50 rounded-2xl transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center transition-colors group-hover:bg-green-100">
                      <i className="fas fa-list-alt text-sm"></i>
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Barcha qarzlar boshqaruvi</span>
                  </div>
                  <i className="fas fa-chevron-right text-xs text-slate-300 transition-transform group-hover:translate-x-1"></i>
                </button>
                <button
                  onClick={() => setSearchParams({ tab: "notifications" })}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/50 rounded-2xl transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center transition-colors group-hover:bg-purple-100">
                      <i className="fas fa-bullhorn text-sm"></i>
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Bildirishnomalar boshqaruvi</span>
                  </div>
                  <i className="fas fa-chevron-right text-xs text-slate-300 transition-transform group-hover:translate-x-1"></i>
                </button>
              </div>
            </div>

            {/* Developer Contact Card */}
            <div className="bg-white border border-slate-100/80 rounded-3xl p-2 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
              <div className="divide-y divide-slate-50">
                <a
                  href="https://t.me/AlimardonToshpulatov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 rounded-2xl transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center transition-colors group-hover:bg-sky-100">
                      <i className="fab fa-telegram-plane text-sm"></i>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dasturchi Telegram</p>
                      <p className="font-bold text-slate-700 text-sm mt-0.5">@AlimardonToshpulatov</p>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-xs text-slate-300 transition-transform group-hover:translate-x-1"></i>
                </a>
                
                <a
                  href="tel:+998509509545"
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 rounded-2xl transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center transition-colors group-hover:bg-teal-100">
                      <i className="fas fa-phone text-sm"></i>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dasturchi Telefon</p>
                      <p className="font-bold text-slate-700 text-sm mt-0.5">+998 (50) 950-95-45</p>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-xs text-slate-300 transition-transform group-hover:translate-x-1"></i>
                </a>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3.5 rounded-2xl font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-sm border border-red-100 shadow-sm"
              >
                <i className="fas fa-sign-out-alt"></i>
                Tizimdan chiqish
              </button>
            </div>

          </div>
        )}

    </div>
  );
}
