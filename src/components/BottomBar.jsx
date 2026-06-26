import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

export default function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [logs, setLogs] = useState([]);

  // Load current user and activity logs
  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    // Load logs from localStorage
    const loadLogs = () => {
      const savedLogs = JSON.parse(localStorage.getItem("activity_logs")) || [];
      // If empty, generate demo logs
      if (savedLogs.length === 0) {
        const demoLogs = [
          {
            id: 1,
            text: "Tizim ishga tushirildi",
            time: new Date(Date.now() - 3600000 * 2).toLocaleTimeString("uz-UZ", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: "system",
          },
          {
            id: 2,
            text: "Admin tizimga kirdi",
            time: new Date(Date.now() - 3600000).toLocaleTimeString("uz-UZ", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: "auth",
          },
        ];
        localStorage.setItem("activity_logs", JSON.stringify(demoLogs));
        setLogs(demoLogs);
      } else {
        setLogs(savedLogs);
      }
    };

    loadLogs();

    // Listen to changes in storage to update logs
    window.addEventListener("storage", loadLogs);
    // Custom event listener for logs added within the same tab
    window.addEventListener("activity_logged", loadLogs);

    return () => {
      window.removeEventListener("storage", loadLogs);
      window.removeEventListener("activity_logged", loadLogs);
    };
  }, [location]);

  // If user is not logged in, do not show Bottom Bar
  const userStr = sessionStorage.getItem("currentUser");
  if (!userStr) return null;

  const handleTabClick = (tab) => {
    setIsNotificationOpen(false);
    setIsProfileOpen(false);

    if (tab === "diagram") {
      navigate("/diagram");
    } else if (tab === "qarzlar") {
      if (location.pathname !== "/") {
        navigate("/", { state: { scrollTo: "list" } });
      } else {
        const listEl = document.getElementById("qarzlar-list-container");
        if (listEl) {
          listEl.scrollIntoView({ behavior: "smooth" });
        } else {
          // Fallback to table element scroll
          const tableEl = document.querySelector("table");
          tableEl?.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else if (tab === "form") {
      navigate("/add-debt");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    setIsProfileOpen(false);
    toast.success("Tizimdan chiqildi!");
    navigate("/login");
  };

  const clearLogs = () => {
    localStorage.setItem("activity_logs", JSON.stringify([]));
    setLogs([]);
    toast.success("Bildirishnomalar tozalandi!");
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "add":
        return "fa-plus-circle text-green-400";
      case "edit":
        return "fa-edit text-yellow-400";
      case "delete":
        return "fa-trash text-red-400";
      case "pay":
        return "fa-check-circle text-blue-400";
      default:
        return "fa-info-circle text-blue-400";
    }
  };

  return (
    <>
      {/* Overlay Backdrops */}
      {(isNotificationOpen || isProfileOpen) && (
        <div
          onClick={() => {
            setIsNotificationOpen(false);
            setIsProfileOpen(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden animate-fade-in"
        ></div>
      )}

      {/* Notifications Drawer */}
      <div
        className={`md:hidden fixed left-0 right-0 bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-5 shadow-2xl z-40 transition-transform duration-300 ${
          isNotificationOpen ? "translate-y-0 bottom-16" : "translate-y-full bottom-0"
        }`}
        style={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <i className="fas fa-bell text-blue-500 animate-pulse"></i>
            Bildirishnomalar
          </h3>
          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="text-xs text-red-400 hover:text-red-300 font-semibold transition"
            >
              Tozalash
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-10 text-zinc-500">
            <i className="fas fa-bell-slash text-3xl mb-2"></i>
            <p className="text-sm">Bildirishnomalar mavjud emas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...logs].reverse().map((log) => (
              <div
                key={log.id}
                className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3 flex gap-3 items-start animate-slide-up"
              >
                <i className={`fas ${getLogIcon(log.type)} text-lg mt-0.5`}></i>
                <div className="flex-1">
                  <p className="text-sm text-zinc-200">{log.text}</p>
                  <span className="text-[10px] text-zinc-500">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Drawer */}
      <div
        className={`md:hidden fixed left-0 right-0 bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 shadow-2xl z-40 transition-transform duration-300 ${
          isProfileOpen ? "translate-y-0 bottom-16" : "translate-y-full bottom-0"
        }`}
      >
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-500/10 border-2 border-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <i className="fas fa-user-tie text-4xl text-blue-500"></i>
          </div>
          <h3 className="text-white font-bold text-xl capitalize">
            {currentUser?.username || "Mehmon"}
          </h3>
          <p className="text-xs text-blue-500 mt-1 font-semibold uppercase tracking-wider">
            {currentUser?.role === "admin" ? "Tizim Administratori" : "Operator / User"}
          </p>
        </div>

        <div className="space-y-3">
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm text-zinc-400">Foydalanuvchi roli</span>
            <span className="text-sm text-zinc-200 capitalize font-medium">
              {currentUser?.role || "-"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md"
          >
            <i className="fas fa-sign-out-alt"></i>
            Tizimdan chiqish
          </button>
        </div>
      </div>

      {/* Navigation Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/60 backdrop-blur-lg px-2 flex justify-between items-center h-16 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
        {/* Tab 1: Diagramma */}
        <button
          onClick={() => handleTabClick("diagram")}
          className={`flex flex-col items-center justify-center flex-1 transition ${
            location.pathname === "/diagram" ? "text-blue-500" : "text-zinc-400 hover:text-blue-500"
          }`}
        >
          <i className="fas fa-chart-line text-lg mb-0.5"></i>
          <span className="text-[9px] font-semibold">Diagrama</span>
        </button>

        {/* Tab 2: Qarzlar ro'yxati */}
        <button
          onClick={() => handleTabClick("qarzlar")}
          className="flex flex-col items-center justify-center flex-1 text-zinc-400 hover:text-blue-500 transition"
        >
          <i className="fas fa-list-ul text-lg mb-0.5"></i>
          <span className="text-[9px] font-semibold">Qarzlar</span>
        </button>

        {/* Tab 3: Center Elevated Form Button (Yangi qarz) */}
        <div className="flex-1 flex justify-center -mt-7 relative">
          <button
            onClick={() => handleTabClick("form")}
            className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-zinc-950 transition active:scale-95 duration-200"
            title="Qarz qo'shish"
          >
            <i className="fas fa-plus text-lg"></i>
          </button>
        </div>

        {/* Tab 4: Bildirishnoma (Xabarlar) */}
        <button
          onClick={() => {
            setIsProfileOpen(false);
            setIsNotificationOpen(!isNotificationOpen);
          }}
          className={`flex flex-col items-center justify-center flex-1 transition relative ${
            isNotificationOpen ? "text-blue-500" : "text-zinc-400 hover:text-blue-500"
          }`}
        >
          <i className="fas fa-bell text-lg mb-0.5"></i>
          <span className="text-[9px] font-semibold">Xabarlar</span>
          {logs.length > 0 && (
            <span className="absolute top-0 right-5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          )}
        </button>

        {/* Tab 5: Profil */}
        <button
          onClick={() => {
            setIsNotificationOpen(false);
            setIsProfileOpen(!isProfileOpen);
          }}
          className={`flex flex-col items-center justify-center flex-1 transition ${
            isProfileOpen ? "text-blue-500" : "text-zinc-400 hover:text-blue-500"
          }`}
        >
          <i className="fas fa-user-circle text-lg mb-0.5"></i>
          <span className="text-[9px] font-semibold">Profil</span>
        </button>
      </div>
    </>
  );
}
