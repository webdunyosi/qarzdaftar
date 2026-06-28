import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function UserLayout() {
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
