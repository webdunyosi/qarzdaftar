import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../assets/web-daftar.png";

const initializeUsers = () => {
  let existing = [];
  try {
    const raw = localStorage.getItem("users");
    if (raw) {
      existing = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse users:", e);
  }

  if (!Array.isArray(existing)) {
    existing = [];
  }

  // Ensure Admin and Marjona are always present
  const hasAdmin = existing.some(u => u && u.username && u.username.toLowerCase() === "admin");
  const hasMarjona = existing.some(u => u && u.username && u.username.toLowerCase() === "marjona");

  let updated = [...existing];
  if (!hasAdmin) {
    updated.push({ username: "Admin", password: "Admin123*", role: "admin" });
  }
  if (!hasMarjona) {
    updated.push({ username: "Marjona", password: "Marjona123*", role: "seller", type: "Kiyim-kechak" });
  }

  // Filter out invalid/corrupt user objects
  updated = updated.filter(u => u && typeof u === "object" && u.username && u.password);

  localStorage.setItem("users", JSON.stringify(updated));
  return updated;
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Load remembered user
  useEffect(() => {
    const rememberedUser = localStorage.getItem("rememberedUser");
    if (rememberedUser) {
      try {
        const user = JSON.parse(rememberedUser);
        setUsername(user.username);
        setPassword(user.password);
        setRemember(true);
      } catch (error) {
        console.error("Failed to parse remembered user:", error);
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const users = initializeUsers();
    const user = users.find(
      (u) => u && u.username && u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (user) {
      if (remember) {
        localStorage.setItem(
          "rememberedUser",
          JSON.stringify({ username: user.username, password })
        );
      } else {
        localStorage.removeItem("rememberedUser");
      }

      sessionStorage.setItem(
        "currentUser",
        JSON.stringify({
          username: user.username,
          role: user.role,
        })
      );

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } else {
      toast.error("Login yoki parol noto'g'ri!");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="main-background"></div>
      <div className="backdrop-blur min-h-screen flex items-center justify-center p-4">
        <div className="login-container bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="store-icon inline-block">
              <img className="w-16 rounded-xl" src={logo} alt="Logo" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Qarz Daftar</h1>
            <p className="text-gray-600">
              Tizimga kirish uchun ma'lumotlaringizni kiriting
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-user mr-2"></i>Login
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-user text-indigo-500"></i>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Loginingizni kiriting"
                  className="pl-10 py-2 w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-lock mr-2"></i>Parol
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-indigo-500"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Parolingizni kiriting"
                  className="pl-10 pr-10 py-2 w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 transition-colors"
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="remember-me flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  Meni eslab qol
                </label>
              </div>
            </div>

            <button type="submit" className="submit-button group w-full py-2.5 rounded-lg text-white font-semibold transition-all">
              <span className="flex items-center justify-center">
                Kirish
                <i className="fas fa-sign-in-alt ml-2 group-hover:translate-x-1 transition-transform"></i>
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
