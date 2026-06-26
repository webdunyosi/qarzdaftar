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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/60 backdrop-blur-lg px-2 flex justify-between items-center h-16 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
        {tabs.map((tab, index) => {
          if (tab === null) {
            // Center elevated + button
            return (
              <div key="add" className="flex-1 flex justify-center -mt-7 relative">
                <button
                  onClick={() => navigate("/add-debt")}
                  className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-zinc-950 transition active:scale-95 duration-200"
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
              className={`flex flex-col items-center justify-center flex-1 transition ${
                isActive ? "text-blue-500" : "text-zinc-400 hover:text-blue-500"
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
