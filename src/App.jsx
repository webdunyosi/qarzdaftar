import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
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

// Component to scroll window to top on pathname or search params change
function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
    };

    handleScroll();
    const timer = setTimeout(handleScroll, 20); // backup for rendering delay
    return () => clearTimeout(timer);
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
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

