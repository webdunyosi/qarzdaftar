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
import AdminLayout from "./components/AdminLayout";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* User (Seller) Routes Wrapped in UserLayout */}
          <Route
            element={
              <ProtectedRoute adminOnly={false}>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/diagram" element={<Diagram />} />
            <Route path="/add-debt" element={<AddDebt />} />
            <Route path="/debts" element={<DebtsList />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin Routes Wrapped in AdminLayout */}
          <Route
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomBar />
      </Router>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

