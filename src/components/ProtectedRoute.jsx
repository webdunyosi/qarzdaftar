import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const currentUserStr = sessionStorage.getItem("currentUser");
  
  if (!currentUserStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(currentUserStr);
    if (adminOnly && user.role !== "admin") {
      return <Navigate to="/" replace />;
    }
    // Admin cannot access seller pages
    if (!adminOnly && user.role === "admin") {
      return <Navigate to="/" replace />;
    }
  } catch (e) {
    console.error(e);
  }

  return children;
}
