import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Diagram from "./pages/Diagram";
import AddDebt from "./pages/AddDebt";
import DebtsList from "./pages/DebtsList";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import BottomBar from "./components/BottomBar";

// Smart root: admin → AdminDashboard, mobile → Home, desktop → Dashboard
function RootPage() {
  const currentUserStr = sessionStorage.getItem("currentUser");
  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      if (currentUser.role === "admin") {
        return <AdminDashboard />;
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (window.innerWidth < 768) {
    return <Home />;
  }
  return <Dashboard />;
}

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RootPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diagram"
            element={
              <ProtectedRoute>
                <Diagram />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-debt"
            element={
              <ProtectedRoute>
                <AddDebt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debts"
            element={
              <ProtectedRoute>
                <DebtsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomBar />
      </Router>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}
