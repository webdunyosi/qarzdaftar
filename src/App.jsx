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
import UserLayout from "./components/UserLayout";

// Smart root: admin → AdminDashboard, sellers → Home (on both desktop & mobile)
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
  return <Home />;
}

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* User Routes Wrapped in Layout */}
          <Route
            element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RootPage />} />
            <Route path="/diagram" element={<Diagram />} />
            <Route path="/add-debt" element={<AddDebt />} />
            <Route path="/debts" element={<DebtsList />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomBar />
      </Router>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

