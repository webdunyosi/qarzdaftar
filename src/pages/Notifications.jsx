import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export default function Notifications() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }

    const loadLogs = async () => {
      setLoading(true);
      const res = await api.get("/logs");
      if (!res.error) {
        setLogs(res);
      } else {
        toast.error(res.error);
      }
      setLoading(false);
    };

    loadLogs();
  }, [navigate]);

  const clearLogs = async () => {
    const res = await api.delete("/logs");
    if (!res.error) {
      toast.success("Bildirishnomalar muvaffaqiyatli tozalandi!");
      setLogs([]);
    } else {
      toast.error(res.error);
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "add": return { icon: "fa-plus-circle", bg: "bg-green-100 text-green-600" };
      case "edit": return { icon: "fa-edit", bg: "bg-yellow-100 text-yellow-600" };
      case "delete": return { icon: "fa-trash", bg: "bg-red-100 text-red-600" };
      case "pay": return { icon: "fa-check-circle", bg: "bg-blue-100 text-blue-600" };
      default: return { icon: "fa-info-circle", bg: "bg-gray-100 text-gray-600" };
    }
  };

  return (
    <div>
      <div className="main-background" />

      <div className="min-h-screen pb-28">
        <div className="px-4 pt-4 space-y-4">
          
          {/* Header Card */}
          <div className="glass-card-premium hover-shadow-blue rounded-3xl p-6 flex items-center justify-between animate-slide-up">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/profile")}
                className="w-10 h-10 bg-slate-100/80 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <div>
                <h2 className="text-slate-800 font-extrabold text-xl">Bildirishnomalar</h2>
                <p className="text-slate-400 text-xs mt-0.5">{logs.length} ta faoliyat logi</p>
              </div>
            </div>

            {logs.length > 0 && (
              <button
                onClick={clearLogs}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <i className="fas fa-trash-alt"></i>
                <span>Tozalash</span>
              </button>
            )}
          </div>

          {/* Logs List Card */}
          <div className="glass-card-premium hover-shadow-blue rounded-3xl p-6 animate-slide-up">
            {loading ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg skeleton-dark-premium flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton-dark-premium rounded w-3/4"></div>
                      <div className="h-3 skeleton-dark-premium rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-bell-slash text-2xl text-slate-400"></i>
                </div>
                <h3 className="text-slate-700 font-bold text-base">Bildirishnomalar mavjud emas</h3>
                <p className="text-slate-400 text-xs mt-1">Hozircha hech qanday tizim faoliyati qayd etilmagan.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/60 max-h-[70vh] overflow-y-auto pr-1">
                {[...logs].reverse().map((log) => {
                  const ic = getLogIcon(log.type);
                  return (
                    <div key={log._id || log.id} className="flex items-start gap-4 py-4 border-b last:border-b-0 border-slate-100/60 hover:bg-slate-50/30 px-2 rounded-2xl transition duration-150">
                      <div className={`w-9 h-9 ${ic.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                        <i className={`fas ${ic.icon} text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-sm font-semibold break-words whitespace-pre-wrap">{log.text}</p>
                        {log.imageUrl && (
                          <div className="mt-2.5 rounded-2xl overflow-hidden border border-slate-100/80 shadow-sm max-w-full">
                            <img
                              src={log.imageUrl}
                              alt="Notification attachment"
                              className="w-full h-auto object-cover max-h-48 cursor-zoom-in"
                              onClick={() => window.open(log.imageUrl, "_blank")}
                              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400?text=Rasm+yuklanmadi"; }}
                            />
                          </div>
                        )}
                        {log.videoUrl && (
                          <div className="mt-2.5 rounded-2xl overflow-hidden border border-slate-100/80 shadow-sm max-w-full">
                            {getYouTubeEmbedUrl(log.videoUrl) ? (
                              <iframe
                                src={getYouTubeEmbedUrl(log.videoUrl)}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-auto aspect-video rounded-2xl bg-black"
                              ></iframe>
                            ) : (
                              <video
                                src={log.videoUrl}
                                controls
                                className="w-full h-auto max-h-48 bg-black"
                                onError={(e) => { console.log("Video load error:", e); }}
                              />
                            )}
                          </div>
                        )}
                        <p className="text-slate-400 text-[11px] font-medium mt-1.5 flex items-center gap-1">
                          <i className="far fa-clock"></i>
                          <span>{log.time}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
