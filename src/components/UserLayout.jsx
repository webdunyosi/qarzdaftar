import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function UserLayout() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ loading: true, blocked: false, unpaid: false, msg: "" });

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await api.get("/auth/me");
      if (res.error) {
        if (res.status === 403) {
          setStatus({ loading: false, blocked: true, unpaid: false, msg: res.error });
        } else if (res.status === 402) {
          setStatus({ loading: false, blocked: false, unpaid: true, msg: res.error });
        } else {
          setStatus({ loading: false, blocked: false, unpaid: false, msg: "" });
        }
      } else {
        if (res.isBlocked) {
          setStatus({ loading: false, blocked: true, unpaid: false, msg: "Hisobingiz bloklangan! Iltimos, administrator bilan bog'laning." });
        } else if (res.paymentStatus === "unpaid" || (res.subscriptionUntil && new Date(res.subscriptionUntil) < new Date())) {
          setStatus({ loading: false, blocked: false, unpaid: true, msg: "Oylik to'lov muddati tugadi! Iltimos, to'lovni amalga oshiring." });
        } else {
          setStatus({ loading: false, blocked: false, unpaid: false, msg: "" });
        }
      }
    };
    fetchStatus();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    toast.success("Tizimdan chiqildi!");
    navigate("/login");
  };

  if (status.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status.blocked || status.unpaid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-center max-w-sm w-full animate-scale-up">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100/60 shadow-sm text-2xl">
            <i className={status.blocked ? "fas fa-user-slash" : "fas fa-credit-card animate-pulse"}></i>
          </div>
          <h3 className="text-lg font-bold text-slate-800 leading-tight">
            {status.blocked ? "Tizimga kirish taqiqlandi" : "To'lov muddati tugadi"}
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-3.5 font-medium leading-relaxed">
            {status.msg}
          </p>
          <div className="mt-6 space-y-3">
            <a
              href="https://t.me/AlimardonToshpulatov"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition active:scale-95 text-xs cursor-pointer shadow-md shadow-blue-500/10"
            >
              <i className="fab fa-telegram-plane mr-1.5"></i> Admin bilan bog'lanish
            </a>
            <button
              onClick={handleLogout}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition active:scale-95 text-xs cursor-pointer"
            >
              Tizimdan chiqish (Logout)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-white">
      {/* Sidebar - fixed and only on desktop */}
      <Sidebar />
      
      {/* Content wrapper with left padding on desktop to clear sidebar */}
      <div className="flex-1 md:pl-64 flex flex-col">
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
