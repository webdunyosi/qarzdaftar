import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) 
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  
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
  const [sellerPhone, setSellerPhone] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPhone, setEditPhone] = useState("");
  
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
  const [collapsedSellers, setCollapsedSellers] = useState({});
  
  // Notification form state
  const [notificationText, setNotificationText] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  const [notificationImageUrl, setNotificationImageUrl] = useState("");
  const [notificationVideoUrl, setNotificationVideoUrl] = useState("");
  const [editingLogId, setEditingLogId] = useState(null);
  const [previewLog, setPreviewLog] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  });
  const [activeSubPage, setActiveSubPage] = useState("settings"); // "settings" or "payments"
  const [datePickerModal, setDatePickerModal] = useState({
    isOpen: false,
    username: "",
    date: ""
  });

  useEffect(() => {
    setActiveSubPage("settings");
  }, [activeTab]);
  
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

  const handleDeleteType = (typeToDelete) => {
    showConfirm(
      `"${typeToDelete}" turini o'chirib tashlamoqchimisiz?`,
      "Sohani o'chirish",
      async () => {
        const res = await api.delete(`/seller-types/${typeToDelete}`);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Sotuvchi turi o'chirildi!");
        loadAllData();
      }
    );
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
      phone: sellerPhone.trim(),
    });

    if (res.error) {
      toast.error(res.error);
      return;
    }
    
    setSellerUsername("");
    setSellerPassword("");
    setSellerPhone("");
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
      phone: editPhone.trim(),
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
  const handleDeleteSeller = (username) => {
    if (username.toLowerCase() === "admin") {
      toast.error("Admin hisobini o'chirib bo'lmaydi!");
      return;
    }
    
    showConfirm(
      `${username} sotuvchini tizimdan butunlay o'chirib tashlamoqchimisiz?`,
      "Sotuvchini o'chirish",
      async () => {
        const res = await api.delete(`/users/${username}`);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Sotuvchi muvaffaqiyatli o'chirildi!");
        loadAllData();
      }
    );
  };
  
  // Send/Update Broadcast notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationText.trim()) {
      toast.error("Iltimos, bildirishnoma matnini kiriting!");
      return;
    }

    const textToSend = notificationText.trim().startsWith("📢 ") 
      ? notificationText.trim() 
      : `📢 ${notificationText.trim()}`;

    if (editingLogId) {
      const res = await api.put(`/logs/${editingLogId}`, {
        text: textToSend,
        type: notificationType,
        imageUrl: notificationImageUrl.trim() || null,
        videoUrl: notificationVideoUrl.trim() || null
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }
      
      setEditingLogId(null);
      setNotificationText("");
      setNotificationImageUrl("");
      setNotificationVideoUrl("");
      toast.success("Bildirishnoma muvaffaqiyatli tahrirlandi!");
      loadAllData();
    } else {
      const res = await api.post("/logs", {
        text: textToSend,
        type: notificationType,
        seller: null, // global/broadcasted to all
        imageUrl: notificationImageUrl.trim() || null,
        videoUrl: notificationVideoUrl.trim() || null
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }
      
      setNotificationText("");
      setNotificationImageUrl("");
      setNotificationVideoUrl("");
      toast.success("Bildirishnoma barcha sotuvchilarga yuborildi!");
      loadAllData();
    }
  };

  const handleDeleteLog = (logId) => {
    showConfirm(
      "Ushbu bildirishnomani tizimdan o'chirib tashlamoqchimisiz?",
      "Bildirishnomani o'chirish",
      async () => {
        const res = await api.delete(`/logs/${logId}`);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Bildirishnoma muvaffaqiyatli o'chirildi!");
        loadAllData();
      }
    );
  };

  const startEditLog = (log) => {
    setEditingLogId(log._id || log.id);
    const cleanText = log.text.startsWith("📢 ") ? log.text.substring(2) : log.text;
    setNotificationText(cleanText);
    setNotificationType(log.type || "info");
    setNotificationImageUrl(log.imageUrl || "");
    setNotificationVideoUrl(log.videoUrl || "");
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const cancelEditLog = () => {
    setEditingLogId(null);
    setNotificationText("");
    setNotificationImageUrl("");
    setNotificationVideoUrl("");
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "add": return { icon: "fa-plus-circle", bg: "bg-green-100 text-green-600" };
      case "edit": return { icon: "fa-edit", bg: "bg-yellow-100 text-yellow-600" };
      case "delete": return { icon: "fa-trash-alt", bg: "bg-red-100 text-red-600" };
      case "pay": return { icon: "fa-check-circle", bg: "bg-blue-100 text-blue-600" };
      default: return { icon: "fa-info-circle", bg: "bg-gray-100 text-gray-600" };
    }
  };

  const showConfirm = (message, title, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title: title || "Tasdiqlash",
      message,
      onConfirm: () => {
        onConfirm();
        closeConfirm();
      }
    });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const getRemainingDays = (dateStr) => {
    if (!dateStr) return null;
    const expiryDate = new Date(dateStr);
    const today = new Date();
    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleUpdateSubscriptionDate = async (username, dateStr) => {
    const res = await api.put(`/users/${username}`, {
      subscriptionUntil: dateStr ? new Date(dateStr) : null
    });
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("To'lov muddati muvaffaqiyatli o'zgartirildi!");
    setDatePickerModal({ isOpen: false, username: "", date: "" });
    loadAllData();
  };

  const handleToggleBlock = (user) => {
    const actionText = user.isBlocked ? "blokdan chiqarmoqchimisiz" : "bloklamoqchimisiz";
    showConfirm(
      `Sotuvchi "${user.username}" ni rostdan ham ${actionText}?`,
      user.isBlocked ? "Blokdan chiqarish" : "Sotuvchini bloklash",
      async () => {
        const res = await api.put(`/users/${user.username}`, {
          isBlocked: !user.isBlocked
        });
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(user.isBlocked ? "Sotuvchi blokdan chiqarildi!" : "Sotuvchi bloklandi!");
        loadAllData();
      }
    );
  };

  const handleTogglePaymentStatus = async (user) => {
    const newStatus = user.paymentStatus === "paid" ? "unpaid" : "paid";
    const res = await api.put(`/users/${user.username}`, {
      paymentStatus: newStatus
    });
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("To'lov holati o'zgartirildi!");
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
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-24 md:pb-6">
        
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
                    <div key={b._id || b.id} className="py-3 flex flex-col border-b last:border-b-0 border-slate-50 gap-2 group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs flex-shrink-0">
                            <i className="fas fa-bullhorn"></i>
                          </div>
                          <p className="font-semibold text-slate-700 text-sm break-words">{b.text}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                          <button
                            onClick={() => setPreviewLog(b)}
                            className="w-6 h-6 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md flex items-center justify-center transition cursor-pointer border border-blue-100/40"
                            title="Sotuvchi ko'rinishida ko'rish"
                          >
                            <i className="fas fa-eye text-[9px]"></i>
                          </button>
                          <span className="text-slate-400 text-[10px] whitespace-nowrap font-semibold">{b.time}</span>
                        </div>
                      </div>
                      {b.imageUrl && (
                        <div className="ml-11 rounded-lg overflow-hidden border border-slate-100 shadow-sm max-w-xs">
                          <img
                            src={b.imageUrl}
                            alt="Preview"
                            className="w-full h-auto object-cover max-h-24 cursor-zoom-in"
                            onClick={() => window.open(b.imageUrl, "_blank")}
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400?text=Rasm+yuklanmadi"; }}
                          />
                        </div>
                      )}
                      {b.videoUrl && (
                        <div className="ml-11 rounded-lg overflow-hidden border border-slate-100 shadow-sm max-w-xs">
                          {getYouTubeEmbedUrl(b.videoUrl) ? (
                            <iframe
                              src={getYouTubeEmbedUrl(b.videoUrl)}
                              title="YouTube video player"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              className="w-full h-auto aspect-video rounded-lg bg-black"
                            ></iframe>
                          ) : (
                            <video
                              src={b.videoUrl}
                              controls
                              className="w-full h-auto max-h-24 bg-black"
                              onError={(e) => { console.log("Video preview load error:", e); }}
                            />
                          )}
                        </div>
                      )}
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
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold !pl-4"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Yangi Parol</label>
                      <input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold !pl-4"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Telefon raqami</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold !pl-4"
                        placeholder="Telefon raqami..."
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
                            Telefon raqami
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              placeholder="Telefon raqami (masalan: +998901234567)..."
                              value={sellerPhone}
                              onChange={(e) => setSellerPhone(e.target.value)}
                              className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
                            />
                            <i className="fas fa-phone absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
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
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm !pl-4"
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
                      className="bg-white border border-slate-100 border-l-4 border-l-blue-600 p-4 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col gap-3"
                    >
                      {/* Top Row: Avatar, Username, Type & Edit/Delete Buttons */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100 flex-shrink-0">
                            <i className="fas fa-user text-sm"></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-none">{u.username}</h3>
                              {u.type && (
                                <span className="bg-blue-50/70 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100/50">
                                  {u.type}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-400 text-[10px] font-semibold mt-1">
                              A'zo: {u.createdAt ? new Date(u.createdAt).toLocaleDateString("uz-UZ") : new Date().toLocaleDateString("uz-UZ")}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100/60 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                            Faol
                          </span>
                          <button
                            onClick={() => {
                              setEditingUserId(u.username);
                              setEditUsername(u.username);
                              setEditPassword(u.password);
                              setEditType(u.type || (sellerTypes[0] || "Kiyim-kechak"));
                              setEditPhone(u.phone || "");
                            }}
                            className="w-8 h-8 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-500 rounded-lg flex items-center justify-center transition border border-slate-100 cursor-pointer"
                            title="Tahrirlash"
                          >
                            <i className="fas fa-pen text-xs"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteSeller(u.username)}
                            className="w-8 h-8 bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-lg flex items-center justify-center transition border border-slate-100 cursor-pointer"
                            title="O'chirish"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="flex items-stretch justify-between gap-1 py-2.5 px-3 bg-slate-50/50 border border-slate-100 rounded-xl text-center">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Jami qarzlar</p>
                          <p className="font-extrabold text-slate-700 text-[11px] sm:text-xs mt-0.5 truncate">
                            {stats.count} ta ({stats.totalAmount.toLocaleString()} so'm)
                          </p>
                        </div>
                        <div className="flex-1 min-w-0 border-x border-slate-200/50">
                          <p className="text-emerald-600 text-[9px] font-bold uppercase tracking-wider">Daromad (Paid)</p>
                          <p className="font-extrabold text-emerald-600 text-[11px] sm:text-xs mt-0.5 truncate">
                            {stats.paidAmount.toLocaleString()} so'm
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-amber-600 text-[9px] font-bold uppercase tracking-wider">Faol qarzlar</p>
                          <p className="font-extrabold text-amber-600 text-[11px] sm:text-xs mt-0.5 truncate">
                            {stats.activeAmount.toLocaleString()} so'm
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <a
                          href={`https://t.me/${u.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100/60 px-3 py-1.5 rounded-xl text-[11px] font-bold transition active:scale-95"
                        >
                          <i className="fab fa-telegram-plane"></i> Telegram
                        </a>
                        {u.phone ? (
                          <a
                            href={`tel:${u.phone}`}
                            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-xl text-[11px] font-bold transition active:scale-95"
                            title="Telefon qilish"
                          >
                            <i className="fas fa-phone-alt"></i> Tel: <span className="font-mono text-emerald-700">{u.phone}</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-400 border border-slate-200 px-3 py-1.5 rounded-xl text-[11px] font-bold">
                            <i className="fas fa-phone-slash"></i> Tel: yo'q
                          </span>
                        )}
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
          <div className="space-y-4 animate-slide-up">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between w-full">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-database text-blue-600"></i>
                Barcha Sotuvchilarning Qarzlar Ro'yxati ({qarzlar.length})
              </h2>
            </div>

            {(() => {
              if (qarzlar.length === 0) {
                return (
                  <div className="bg-white border border-slate-100 p-8 rounded-2xl text-center shadow-sm">
                    <p className="text-slate-500 font-medium">Qarzlar kiritilmagan.</p>
                  </div>
                );
              }

              // Group debts by seller name
              const groupedDebts = qarzlar.reduce((acc, q) => {
                const sellerName = q.seller || "Marjona";
                if (!acc[sellerName]) acc[sellerName] = [];
                acc[sellerName].push(q);
                return acc;
              }, {});

              const toggleSellerCollapse = (sellerName) => {
                setCollapsedSellers(prev => {
                  const current = prev[sellerName] ?? true;
                  return {
                    ...prev,
                    [sellerName]: !current
                  };
                });
              };

              return (
                <div className="space-y-4">
                  {Object.entries(groupedDebts).map(([sellerName, sellerDebts]) => {
                    const totalSum = sellerDebts.reduce((sum, q) => sum + Number(q.qarzMiqdori || q.miqdor || 0), 0);
                    const isCollapsed = collapsedSellers[sellerName] ?? true;

                    return (
                      <div key={sellerName} className="bg-white border border-slate-100/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                        {/* Seller Header Row */}
                        <div 
                          onClick={() => toggleSellerCollapse(sellerName)}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-base border border-blue-100/50 uppercase flex-shrink-0">
                              {sellerName[0]}
                            </div>
                            <div>
                              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base capitalize leading-tight">{sellerName}</h3>
                              <p className="text-slate-400 text-[10px] sm:text-[11px] font-semibold mt-0.5">
                                {sellerDebts.length} ta qarz &bull; Jami: {totalSum.toLocaleString()} so'm
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-blue-100/40">
                              Sotuvchi
                            </span>
                            <button className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                              <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'} text-xs transition-transform`}></i>
                            </button>
                          </div>
                        </div>

                        {/* Seller's Debts List (Collapsible) */}
                        {!isCollapsed && (
                          <div className="mt-4 pt-4 border-t border-slate-100/70 space-y-3 animate-slide-up">
                            {sellerDebts.map((q) => (
                              <div key={q.id || q._id} className="bg-slate-50/50 border border-slate-100/80 rounded-xl p-3.5 space-y-2.5">
                                {/* Customer info row */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-blue-100/50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                      {q.mijozIsmi[0]}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight">{q.mijozIsmi}</h4>
                                      <p className="text-slate-400 text-[10px] font-semibold mt-0.5">
                                        {q.telefon || "Telefon kiritilmagan"}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {q.telefon && (
                                      <a
                                        href={`tel:${q.telefon}`}
                                        className="w-7 h-7 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center transition border border-emerald-100/50"
                                        title="Qo'ng'iroq qilish"
                                      >
                                        <i className="fas fa-phone-alt text-[10px]"></i>
                                      </a>
                                    )}
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                      q.status === "To'langan" 
                                        ? "bg-green-50 text-green-600 border-green-100" 
                                        : "bg-amber-50 text-amber-600 border-amber-100"
                                    }`}>
                                      {q.status}
                                    </span>
                                  </div>
                                </div>

                                {/* Debt Details Sub-card */}
                                <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                                  <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Mahsulot</p>
                                    <p className="font-extrabold text-slate-700 text-xs sm:text-sm mt-0.5">{q.mahsulot}</p>
                                  </div>
                                  
                                  <div className="text-center sm:text-left">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Muddatlar</p>
                                    <p className="text-slate-500 text-[9px] font-semibold mt-0.5">
                                      Sana: <span className="text-slate-700">{new Date(q.sana).toLocaleDateString("uz-UZ")}</span>
                                    </p>
                                    <p className="text-slate-500 text-[9px] font-semibold">
                                      Muddati: <span className="text-slate-700">{new Date(q.tolashMuddati).toLocaleDateString("uz-UZ")}</span>
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Qarz Miqdori</p>
                                    <p className="font-black text-blue-600 text-xs sm:text-sm mt-0.5">
                                      {Number(q.qarzMiqdori || q.miqdor || 0).toLocaleString()} so'm
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab Content 3: Send Notification */}
        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Form */}
            <div ref={formRef} className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-5 shadow-md md:col-span-2">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-bullhorn text-blue-600"></i>
                {editingLogId ? "Bildirishnomani Tahrirlash" : "Sotuvchilarga Bildirishnoma Yuborish"}
              </h2>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Xabar turi</label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value)}
                    className="w-full p-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold appearance-none cursor-pointer"
                  >
                    <option value="info">Info</option>
                    <option value="pay">Muvaffaqiyatli</option>
                    <option value="edit">Ogohlantirish</option>
                    <option value="delete">Muhim / Xavf</option>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Rasm URL manzili</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... (ixtiyoriy)"
                      value={notificationImageUrl}
                      onChange={(e) => setNotificationImageUrl(e.target.value)}
                      className="w-full p-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Video URL manzili</label>
                    <input
                      type="url"
                      placeholder="https://example.com/video.mp4 (ixtiyoriy)"
                      value={notificationVideoUrl}
                      onChange={(e) => setNotificationVideoUrl(e.target.value)}
                      className="w-full p-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  {editingLogId && (
                    <button
                      type="button"
                      onClick={cancelEditLog}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-sm"
                    >
                      Bekor qilish
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition active:scale-95 cursor-pointer shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 text-sm"
                  >
                    <i className={editingLogId ? "fas fa-save" : "fas fa-paper-plane"}></i>
                    {editingLogId ? "O'zgarishlarni Saqlash" : "Bildirishnomani tarqatish (Send)"}
                  </button>
                </div>
              </form>
            </div>

            {/* Previously sent history */}
            <div className="bg-blue-50/85 border border-blue-100/70 backdrop-blur-md rounded-2xl p-5 shadow-md">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-history text-blue-600"></i>
                Oxirgi yuborilganlar
              </h2>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {broadcasts.length === 0 ? (
                  <p className="text-slate-400 text-center py-6 text-sm">Xabarlar yuborilmagan.</p>
                ) : (
                  [...broadcasts].reverse().slice(0, 10).map((b) => (
                    <div key={b._id || b.id} className="bg-white/80 border border-blue-100/40 p-3 rounded-xl text-xs shadow-sm flex flex-col gap-2">
                      <p className="font-semibold text-slate-700 break-words whitespace-pre-wrap">{b.text}</p>
                      {b.imageUrl && (
                        <div className="rounded-lg overflow-hidden border border-slate-100 shadow-sm max-w-full">
                          <img
                            src={b.imageUrl}
                            alt="Preview"
                            className="w-full h-auto object-cover max-h-32 cursor-zoom-in"
                            onClick={() => window.open(b.imageUrl, "_blank")}
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400?text=Rasm+yuklanmadi"; }}
                          />
                        </div>
                      )}
                      {b.videoUrl && (
                        <div className="rounded-lg overflow-hidden border border-slate-100 shadow-sm max-w-full">
                          {getYouTubeEmbedUrl(b.videoUrl) ? (
                            <iframe
                              src={getYouTubeEmbedUrl(b.videoUrl)}
                              title="YouTube video player"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              className="w-full h-auto aspect-video rounded-lg bg-black"
                            ></iframe>
                          ) : (
                            <video
                              src={b.videoUrl}
                              controls
                              className="w-full h-auto max-h-32 bg-black"
                              onError={(e) => { console.log("Video preview load error:", e); }}
                            />
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/50">
                        <span className="text-slate-400 text-[9px] font-semibold">{b.time}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewLog(b)}
                            className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center transition border border-blue-100/40 cursor-pointer"
                            title="Sotuvchi ko'rinishida ko'rish"
                          >
                            <i className="fas fa-eye text-[10px]"></i>
                          </button>
                          <button
                            onClick={() => startEditLog(b)}
                            className="w-7 h-7 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center transition border border-amber-100/40 cursor-pointer"
                            title="Tahrirlash"
                          >
                            <i className="fas fa-pen text-[10px]"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteLog(b._id || b.id)}
                            className="w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center transition border border-rose-100/40 cursor-pointer"
                            title="O'chirish"
                          >
                            <i className="fas fa-trash-alt text-[10px]"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        )}

        {/* Tab Content 4: Admin own profile change */}
        {activeTab === "settings" && (
          <div className="w-full mx-auto space-y-5 animate-slide-up pb-10">
            {activeSubPage === "payments" ? (
              /* Payments Control View */
              <div className="space-y-6">
                
                {/* Header Row */}
                <div className="bg-white border border-slate-100/80 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveSubPage("settings")}
                      className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-600 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer"
                      title="Orqaga"
                    >
                      <i className="fas fa-arrow-left text-sm"></i>
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Sotuvchilar oylik to'lovi va faolligi</h2>
                      <p className="text-slate-400 text-xs font-semibold mt-0.5">Oylik to'lov muddati va bloklarni boshqarish</p>
                    </div>
                  </div>
                </div>

                {/* Sellers subscription list */}
                <div className="space-y-4">
                  {users
                    .filter(u => u.role === "seller")
                    .map(u => {
                      const isExpired = u.subscriptionUntil && new Date(u.subscriptionUntil) < new Date();
                      const isUnpaid = u.paymentStatus === "unpaid" || isExpired;
                      
                      return (
                        <div key={u._id || u.id} className={`bg-white border p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-md transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          u.isBlocked 
                            ? "border-red-100 bg-red-50/20" 
                            : isUnpaid 
                            ? "border-amber-100 bg-amber-50/20"
                            : "border-slate-100"
                        }`}>
                          
                          {/* Seller Details */}
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-sm ${
                              u.isBlocked 
                                ? "bg-red-100 text-red-600 border border-red-200" 
                                : isUnpaid 
                                ? "bg-amber-100 text-amber-600 border border-amber-200"
                                : "bg-blue-100 text-blue-600 border border-blue-200"
                            }`}>
                              {u.username[0].toUpperCase()}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-slate-800 text-sm sm:text-base capitalize">{u.username}</h4>
                                {u.isBlocked ? (
                                  <span className="bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                    Bloklangan
                                  </span>
                                ) : isUnpaid ? (
                                  <span className="bg-amber-100 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                                    To'lov muddati o'tgan
                                  </span>
                                ) : (
                                  <span className="bg-emerald-100 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                    Faol (Paid)
                                  </span>
                                )}

                                {/* Remaining days badge */}
                                {!u.isBlocked && u.subscriptionUntil && (() => {
                                  const rem = getRemainingDays(u.subscriptionUntil);
                                  if (rem === null) return null;
                                  if (rem > 0) {
                                    return (
                                      <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                        {rem} kun qoldi
                                      </span>
                                    );
                                  } else if (rem === 0) {
                                    return (
                                      <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                                        Bugun oxirgi kun!
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                        {Math.abs(rem)} kun o'tdi
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                              
                              <p className="text-slate-400 text-xs font-semibold mt-1 flex items-center gap-1.5">
                                <i className="fas fa-phone-alt"></i> {u.phone || "Telefon kiritilmagan"}
                                <span className="text-slate-200">|</span>
                                <i className="fas fa-store"></i> {u.type || "Do'kon turi yo'q"}
                              </p>
                            </div>
                          </div>

                          {/* Subscription Control Actions */}
                          <div className="flex flex-wrap items-end gap-4 pt-3 md:pt-0 border-t border-slate-100 md:border-t-0 justify-between">
                            
                            {/* Expiry Date picker */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To'lov muddati</label>
                              <button
                                onClick={() => setDatePickerModal({
                                  isOpen: true,
                                  username: u.username,
                                  date: u.subscriptionUntil ? new Date(u.subscriptionUntil).toISOString().split("T")[0] : ""
                                })}
                                className="p-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer text-slate-700 shadow-sm flex items-center gap-2 transition"
                              >
                                <i className="far fa-calendar-alt text-blue-600 text-sm"></i>
                                <span>
                                  {u.subscriptionUntil 
                                    ? new Date(u.subscriptionUntil).toLocaleDateString("uz-UZ", { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                                    : "Belgilanmagan"
                                  }
                                </span>
                              </button>
                            </div>

                            {/* Toggles */}
                            <div className="flex items-center gap-2.5">
                              {/* Payment status toggle */}
                              <button
                                onClick={() => handleTogglePaymentStatus(u)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm border ${
                                  u.paymentStatus === "paid"
                                    ? "bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                                    : "bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200"
                                }`}
                                title="To'lov holatini o'zgartirish"
                              >
                                <i className={`fas ${u.paymentStatus === "paid" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
                                <span>{u.paymentStatus === "paid" ? "To'langan" : "To'lanmagan"}</span>
                              </button>

                              {/* Block toggle button */}
                              <button
                                onClick={() => handleToggleBlock(u)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm border ${
                                  u.isBlocked
                                    ? "bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-red-500/10"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                                title={u.isBlocked ? "Blokdan chiqarish" : "Bloklash"}
                              >
                                <i className={`fas ${u.isBlocked ? "fa-user-check" : "fa-user-alt-slash"}`}></i>
                                <span>{u.isBlocked ? "Ochish" : "Bloklash"}</span>
                              </button>
                            </div>

                          </div>

                        </div>
                      );
                    })}
                </div>

              </div>
            ) : (
              /* Main Settings Layout */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Profile Card & Logout */}
                <div className="space-y-5">
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
                          <div className="mt-1.5">
                            <span className="bg-blue-50 text-blue-600 border border-blue-100/50 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                              <i className="fas fa-crown text-[8px]"></i>
                              Admin
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
                              className="w-full p-3 bg-slate-50 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm !pl-4"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Yangi Parol</label>
                            <input
                              type="password"
                              placeholder="Yangi admin parolini kiriting"
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              className="w-full p-3 bg-slate-50 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm !pl-4"
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

                  {/* Logout Button */}
                  <div className="pt-2 hidden md:block">
                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3.5 rounded-2xl font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-sm border border-red-100 shadow-sm"
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      Tizimdan chiqish
                    </button>
                  </div>
                </div>

                {/* Right Column: Navigation & Developer Contacts */}
                <div className="space-y-5">
                  {/* Navigation / Control Card */}
                  <div className="bg-white border border-slate-100/80 rounded-3xl p-2 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                    <button
                      onClick={() => setActiveSubPage("payments")}
                      className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/50 rounded-2xl transition cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center transition-colors group-hover:bg-amber-100">
                          <i className="fas fa-credit-card text-sm"></i>
                        </div>
                        <span className="font-bold text-slate-700 text-sm">Oylik to'lovlar boshqaruvi</span>
                      </div>
                      <i className="fas fa-chevron-right text-xs text-slate-300 transition-transform group-hover:translate-x-1"></i>
                    </button>
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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dasturchi Telegrami</p>
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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dasturchi Telefoni</p>
                            <p className="font-bold text-slate-700 text-sm mt-0.5">+998 (50) 950-95-45</p>
                          </div>
                        </div>
                        <i className="fas fa-chevron-right text-xs text-slate-300 transition-transform group-hover:translate-x-1"></i>
                      </a>
                    </div>
                  </div>

                  {/* Logout Button (Mobile Only) */}
                  <div className="pt-2 block md:hidden">
                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3.5 rounded-2xl font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-sm border border-red-100 shadow-sm"
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      Tizimdan chiqish
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Preview Modal */}
        {previewLog && (() => {
          const ic = getLogIcon(previewLog.type);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
              <div className="bg-white border border-blue-100 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-scale-up relative">
                
                {/* Close Button */}
                <button
                  onClick={() => setPreviewLog(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                >
                  <i className="fas fa-times"></i>
                </button>

                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <i className="fas fa-eye text-blue-600"></i>
                  Sotuvchilar uchun ko'rinishi
                </h3>

                {/* Mock Notification bubble */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm flex items-start gap-4">
                  <div className={`w-9 h-9 ${ic.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <i className={`fas ${ic.icon} text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm font-semibold break-words whitespace-pre-wrap">{previewLog.text}</p>
                    {previewLog.imageUrl && (
                      <div className="mt-2.5 rounded-2xl overflow-hidden border border-slate-100 shadow-sm max-w-full">
                        <img
                          src={previewLog.imageUrl}
                          alt="Notification attachment"
                          className="w-full h-auto object-cover max-h-48"
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400?text=Rasm+yuklanmadi"; }}
                        />
                      </div>
                    )}
                    {previewLog.videoUrl && (
                      <div className="mt-2.5 rounded-2xl overflow-hidden border border-slate-100 shadow-sm max-w-full">
                        {getYouTubeEmbedUrl(previewLog.videoUrl) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(previewLog.videoUrl)}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-auto aspect-video rounded-2xl bg-black"
                          ></iframe>
                        ) : (
                          <video
                            src={previewLog.videoUrl}
                            controls
                            className="w-full h-auto max-h-48 bg-black"
                          />
                        )}
                      </div>
                    )}
                    <p className="text-slate-400 text-[11px] font-medium mt-1.5 flex items-center gap-1">
                      <i className="far fa-clock"></i>
                      <span>{previewLog.time || "Bugun"}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => setPreviewLog(null)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-md shadow-blue-500/10 cursor-pointer text-sm"
                  >
                    Yopish
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Custom Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-slate-100 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up text-center relative">
              
              {/* Alert Warning Trash Icon */}
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100/60 shadow-sm text-2xl">
                <i className="fas fa-trash-alt animate-pulse"></i>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-slate-800 leading-tight">
                {confirmModal.title}
              </h3>

              {/* Message Description */}
              <p className="text-slate-500 text-xs sm:text-sm mt-2.5 font-medium leading-relaxed">
                {confirmModal.message}
              </p>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeConfirm}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition active:scale-95 text-xs cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition active:scale-95 text-xs cursor-pointer shadow-md shadow-red-500/10"
                >
                  O'chirish
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Date Picker Modal */}
        {datePickerModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-slate-100 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up relative">
              
              {/* Close Button */}
              <button
                onClick={() => setDatePickerModal({ isOpen: false, username: "", date: "" })}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>

              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                <i className="far fa-calendar-alt text-blue-600"></i>
                To'lov muddatini tanlash
              </h3>

              <p className="text-xs text-slate-500 mb-3.5 font-semibold">
                Sotuvchi: <span className="capitalize text-slate-700 font-extrabold">{datePickerModal.username}</span>
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Muddati (Sana)</label>
                <input
                  type="date"
                  value={datePickerModal.date}
                  onChange={(e) => setDatePickerModal(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm text-slate-700 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDatePickerModal({ isOpen: false, username: "", date: "" })}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition active:scale-95 text-xs cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={() => handleUpdateSubscriptionDate(datePickerModal.username, datePickerModal.date)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition active:scale-95 text-xs cursor-pointer shadow-md shadow-blue-500/10"
                >
                  Saqlash
                </button>
              </div>

            </div>
          </div>
        )}

    </div>
  );
}
