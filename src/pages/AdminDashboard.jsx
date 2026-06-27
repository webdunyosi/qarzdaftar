import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // Lists loaded from localStorage
  const [users, setUsers] = useState([]);
  const [qarzlar, setQarzlar] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "sellers";
  
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
  
  const loadAllData = () => {
    // Users list
    const savedUsers = JSON.parse(localStorage.getItem("users")) || [
      { username: "Admin", password: "Admin123*", role: "admin" },
      { username: "Marjona", password: "Marjona123*", role: "seller", type: "Kiyim-kechak" }
    ];
    setUsers(savedUsers);
    
    // Debts list
    const savedQarzlar = JSON.parse(localStorage.getItem("qarzlar")) || [];
    setQarzlar(savedQarzlar);
    
    // Broadcast notifications (from activity_logs where seller is null/global)
    const savedLogs = JSON.parse(localStorage.getItem("activity_logs")) || [];
    const globalBroadcasts = savedLogs.filter(log => log.type === "broadcast" || !log.seller);
    setBroadcasts(globalBroadcasts);

    // Load seller types (categories)
    const savedTypes = JSON.parse(localStorage.getItem("seller_types")) || [
      "Kiyim-kechak",
      "Oziq-ovqat",
      "Go'sht mahsulotlari (Tovuq)",
      "Maishiy texnika"
    ];
    setSellerTypes(savedTypes);
    if (savedTypes.length > 0 && !sellerType) {
      setSellerType(savedTypes[0]);
    }
  };

  const handleAddType = (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    if (sellerTypes.includes(newTypeName.trim())) {
      toast.error("Bunday tur allaqachon mavjud!");
      return;
    }
    const updatedTypes = [...sellerTypes, newTypeName.trim()];
    localStorage.setItem("seller_types", JSON.stringify(updatedTypes));
    setSellerTypes(updatedTypes);
    setNewTypeName("");
    toast.success("Yangi tur qo'shildi!");
    
    if (!sellerType) {
      setSellerType(newTypeName.trim());
    }
  };

  const handleDeleteType = (typeToDelete) => {
    if (window.confirm(`"${typeToDelete}" turini o'chirib tashlamoqchimisiz?`)) {
      const updatedTypes = sellerTypes.filter(t => t !== typeToDelete);
      localStorage.setItem("seller_types", JSON.stringify(updatedTypes));
      setSellerTypes(updatedTypes);
      toast.success("Sotuvchi turi o'chirildi!");
      
      if (sellerType === typeToDelete) {
        setSellerType(updatedTypes[0] || "");
      }
    }
  };
  
  // Add new seller
  const handleAddSeller = (e) => {
    e.preventDefault();
    if (!sellerUsername.trim() || !sellerPassword.trim()) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }
    
    const existing = users.find(u => u.username.toLowerCase() === sellerUsername.trim().toLowerCase());
    if (existing) {
      toast.error("Bunday nomli sotuvchi allaqachon mavjud!");
      return;
    }
    
    const newSeller = {
      username: sellerUsername.trim(),
      password: sellerPassword.trim(),
      role: "seller",
      type: sellerType || (sellerTypes[0] || "Kiyim-kechak")
    };
    
    const updatedUsers = [...users, newSeller];
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setSellerUsername("");
    setSellerPassword("");
    toast.success("Yangi sotuvchi muvaffaqiyatli qo'shildi!");
  };
  
  // Save edited seller username/password
  const handleSaveSellerEdit = (e) => {
    e.preventDefault();
    if (!editUsername.trim() || !editPassword.trim()) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }
    
    // Check duplication (excluding currently editing one)
    const otherUser = users.find(u => 
      u.username.toLowerCase() === editUsername.trim().toLowerCase() && 
      u.username !== users.find(x => x.username === editingUserId)?.username
    );
    
    if (otherUser) {
      toast.error("Ushbu login band!");
      return;
    }
    
    const updatedUsers = users.map(u => {
      if (u.username === editingUserId) {
        // Update associated debts with the new username
        if (u.username !== editUsername.trim()) {
          const allDebts = JSON.parse(localStorage.getItem("qarzlar")) || [];
          const updatedDebts = allDebts.map(q => 
            (q.seller || "Marjona") === u.username ? { ...q, seller: editUsername.trim() } : q
          );
          localStorage.setItem("qarzlar", JSON.stringify(updatedDebts));
          setQarzlar(updatedDebts);
        }
        return { 
          ...u, 
          username: editUsername.trim(), 
          password: editPassword.trim(),
          type: editType
        };
      }
      return u;
    });
    
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setEditingUserId(null);
    toast.success("Sotuvchi ma'lumotlari muvaffaqiyatli tahrirlandi!");
  };
  
  // Delete seller
  const handleDeleteSeller = (username) => {
    if (username.toLowerCase() === "admin") {
      toast.error("Admin hisobini o'chirib bo'lmaydi!");
      return;
    }
    
    if (window.confirm(`${username} sotuvchini tizimdan butunlay o'chirib tashlamoqchimisiz?`)) {
      const updatedUsers = users.filter(u => u.username !== username);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      toast.success("Sotuvchi muvaffaqiyatli o'chirildi!");
    }
  };
  
  // Send Broadcast notification
  const handleSendNotification = (e) => {
    e.preventDefault();
    if (!notificationText.trim()) {
      toast.error("Iltimos, bildirishnoma matnini kiriting!");
      return;
    }
    
    const savedLogs = JSON.parse(localStorage.getItem("activity_logs")) || [];
    const newLog = {
      id: Date.now(),
      text: `📢 ${notificationText.trim()}`,
      time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      type: notificationType,
      seller: null // global/broadcasted to all
    };
    
    const updatedLogs = [...savedLogs, newLog].slice(-50);
    localStorage.setItem("activity_logs", JSON.stringify(updatedLogs));
    
    setNotificationText("");
    toast.success("Bildirishnoma barcha sotuvchilarga yuborildi!");
    loadAllData();
  };
  
  // Change Admin Profile
  const handleUpdateAdminProfile = (e) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) {
      toast.error("Iltimos, login va parolni kiriting!");
      return;
    }
    
    const updatedUsers = users.map(u => {
      if (u.role === "admin") {
        return { ...u, username: adminUsername.trim(), password: adminPassword.trim() };
      }
      return u;
    });
    
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    
    // Update currentUser in session
    sessionStorage.setItem("currentUser", JSON.stringify({
      username: adminUsername.trim(),
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
        
        {/* Global Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md p-4 rounded-2xl shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-store text-sm"></i>
              </div>
              <p className="text-slate-500 text-xs font-semibold">Sotuvchilar</p>
            </div>
            <p className="text-2xl font-black text-slate-800">{totalSellersCount} ta</p>
          </div>
          <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md p-4 rounded-2xl shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-hand-holding-usd text-sm"></i>
              </div>
              <p className="text-slate-500 text-xs font-semibold">Jami Daromad</p>
            </div>
            <p className="text-xl sm:text-2xl font-black text-green-600">{totalSystemRevenue.toLocaleString()} <span className="text-xs">so'm</span></p>
          </div>
          <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md p-4 rounded-2xl shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-invoice-dollar text-sm"></i>
              </div>
              <p className="text-slate-500 text-xs font-semibold">Faol Qarzlar</p>
            </div>
            <p className="text-xl sm:text-2xl font-black text-yellow-600">{totalActiveDebts.toLocaleString()} <span className="text-xs">so'm</span></p>
          </div>
          <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md p-4 rounded-2xl shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-coins text-sm"></i>
              </div>
              <p className="text-slate-500 text-xs font-semibold">Jami Ayblov</p>
            </div>
            <p className="text-xl sm:text-2xl font-black text-indigo-600">{totalSystemDebts.toLocaleString()} <span className="text-xs">so'm</span></p>
          </div>
        </div>



        {/* Tab Content 1: Sellers Management */}
        {activeTab === "sellers" && (
          <div className="space-y-6">
            
            {/* Grid for Add Seller + Manage Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Add Seller Section */}
              <div className="lg:col-span-2 bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-5 shadow-md flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-user-plus text-blue-600"></i>
                    Yangi Sotuvchi Qo'shish
                  </h2>
                  <form onSubmit={handleAddSeller} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Sotuvchi logini (ism)"
                          value={sellerUsername}
                          onChange={(e) => setSellerUsername(e.target.value)}
                          className="w-full p-3 pl-10 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        />
                        <i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Sotuvchi paroli"
                          value={sellerPassword}
                          onChange={(e) => setSellerPassword(e.target.value)}
                          className="w-full p-3 pl-10 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        />
                        <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                          Sotuvchi turi / Do'kon sohasi
                        </label>
                        <select
                          value={sellerType}
                          onChange={(e) => setSellerType(e.target.value)}
                          className="w-full p-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold appearance-none cursor-pointer"
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
                      </div>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-bold transition active:scale-95 cursor-pointer shadow-lg shadow-blue-500/10 h-[48px] sm:w-auto w-full"
                      >
                        Sotuvchini qo'shish
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Manage Types / Categories Section */}
              <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-5 shadow-md flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-tags text-blue-600"></i>
                    Sotuvchi Turlari
                  </h2>
                  
                  {/* Category badges list */}
                  <div className="flex flex-wrap gap-2 mb-4 max-h-[120px] overflow-y-auto p-1 bg-white/40 rounded-xl border border-slate-100">
                    {sellerTypes.length === 0 ? (
                      <p className="text-slate-400 text-xs p-2">Turlar yaratilmagan</p>
                    ) : (
                      sellerTypes.map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm"
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

                <form onSubmit={handleAddType} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Yangi tur nomi..."
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-bold transition active:scale-95 cursor-pointer shadow-md text-xs flex items-center justify-center min-w-[40px]"
                    title="Qo'shish"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </form>
              </div>

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

            {/* Sellers List section */}
            <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-5 shadow-md">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-list text-blue-600"></i>
                Sotuvchilar va Daromadlar Ro'yxati
              </h2>
              <div className="space-y-4">
                {users.filter(u => u.role === "seller").length === 0 ? (
                  <p className="text-slate-500 text-center py-6">Hozircha sotuvchilar mavjud emas.</p>
                ) : (
                  users.filter(u => u.role === "seller").map((u) => {
                    const stats = getSellerStats(u.username);
                    return (
                      <div key={u.username} className="bg-white/80 border border-blue-100/40 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-sm capitalize">
                            {u.username[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800 text-base">{u.username}</p>
                              {u.type && (
                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                                  {u.type}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-400 text-xs font-semibold">Parol: {u.password}</p>
                          </div>
                        </div>

                        {/* Revenue details */}
                        <div className="grid grid-cols-3 gap-3 md:gap-6 text-center border-t border-slate-100 pt-3 md:pt-0 md:border-0">
                          <div>
                            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Jami qarzlar</p>
                            <p className="font-bold text-slate-800 text-sm mt-0.5">{stats.count} ta ({stats.totalAmount.toLocaleString()} so'm)</p>
                          </div>
                          <div>
                            <p className="text-green-600 text-[10px] font-semibold uppercase tracking-wider">Daromad (Paid)</p>
                            <p className="font-bold text-green-600 text-sm mt-0.5">{stats.paidAmount.toLocaleString()} so'm</p>
                          </div>
                          <div>
                            <p className="text-yellow-600 text-[10px] font-semibold uppercase tracking-wider">Faol qarzlar</p>
                            <p className="font-bold text-yellow-600 text-sm mt-0.5">{stats.activeAmount.toLocaleString()} so'm</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingUserId(u.username);
                              setEditUsername(u.username);
                              setEditPassword(u.password);
                              setEditType(u.type || (sellerTypes[0] || "Kiyim-kechak"));
                            }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2.5 rounded-xl border border-blue-100/60 transition active:scale-95 cursor-pointer text-xs font-bold"
                            title="Tahrirlash"
                          >
                            <i className="fas fa-edit mr-1"></i> Tahrirlash
                          </button>
                          <button
                            onClick={() => handleDeleteSeller(u.username)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl border border-red-200/40 transition active:scale-95 cursor-pointer text-xs font-bold"
                            title="O'chirish"
                          >
                            <i className="fas fa-trash-alt mr-1"></i> O'chirish
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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
          <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-5 shadow-md max-w-md mx-auto animate-slide-up">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <i className="fas fa-user-shield text-blue-600"></i>
              Admin Profil Sozlamalari
            </h2>
            <form onSubmit={handleUpdateAdminProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Admin Logini</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full p-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Yangi Parol</label>
                <input
                  type="password"
                  placeholder="Yangi admin parolini kiriting"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full p-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition active:scale-95 cursor-pointer shadow-md"
              >
                O'zgarishlarni saqlash
              </button>
            </form>
            
            {/* Tizimdan chiqish tugmasi */}
            <div className="pt-4 border-t border-slate-200/60">
              <button
                onClick={handleLogout}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-sm border border-red-100/50 shadow-sm"
              >
                <i className="fas fa-sign-out-alt"></i>
                Tizimdan chiqish (Log Out)
              </button>
            </div>
          </div>
        )}

    </div>
  );
}
