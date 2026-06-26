import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const currentUserStr = sessionStorage.getItem("currentUser");
  
  if (!currentUserStr) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
