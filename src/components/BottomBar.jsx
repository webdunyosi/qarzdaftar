import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();

  // If user is not logged in, do not show Bottom Bar
  const userStr = sessionStorage.getItem("currentUser");
  if (!userStr) return null;

  const tabs = [
    {
      id: "home",
      icon: "fa-home",
      label: "Bosh sahifa",
      path: "/",
      action: () => navigate("/"),
    },
    {
      id: "qarzlar",
      icon: "fa-list-ul",
      label: "Qarzlar",
      path: "/debts",
      action: () => navigate("/debts"),
    },
    null, // center elevated button placeholder
    {
      id: "diagram",
      icon: "fa-chart-line",
      label: "Diagrama",
      path: "/diagram",
      action: () => navigate("/diagram"),
    },
    {
      id: "profil",
      icon: "fa-user-circle",
      label: "Profil",
      path: "/profile",
      action: () => navigate("/profile"),
    },
  ];

  return (
    <>
      {/* Navigation Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/80 backdrop-blur-xl px-2 flex justify-between items-center h-16 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        {tabs.map((tab, index) => {
          if (tab === null) {
            // Center elevated + button
            return (
              <div key="add" className="flex-1 flex justify-center -mt-7 relative">
                <button
                  onClick={() => navigate("/add-debt")}
                  className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(37,99,235,0.4)] border-4 border-white transition-all active:scale-90 duration-200 cursor-pointer"
                  title="Qarz qo'shish"
                >
                  <i className="fas fa-plus text-lg"></i>
                </button>
              </div>
            );
          }

          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.id}
              onClick={tab.action}
              className={`flex flex-col items-center justify-center flex-1 transition-all duration-200 cursor-pointer ${
                isActive ? "text-blue-600 scale-105 font-bold" : "text-slate-400 hover:text-blue-600"
              }`}
            >
              <i className={`fas ${tab.icon} text-lg mb-0.5`}></i>
              <span className="text-[9px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
