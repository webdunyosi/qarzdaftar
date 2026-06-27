import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function UserLayout() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAdmin(user.role === "admin");
      } catch (e) {
        console.error("Failed to parse user in UserLayout", e);
      }
    }
  }, []);

  if (isAdmin) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Sidebar - fixed and only on desktop */}
      <Sidebar />
      
      {/* Content wrapper with left padding on desktop to clear sidebar */}
      <div className="flex-1 md:pl-64 min-h-screen w-full flex flex-col">
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
