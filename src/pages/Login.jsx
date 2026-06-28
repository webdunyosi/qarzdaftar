import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../assets/web-daftar.png";
import api from "../utils/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Login va parolni kiriting!");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });

      if (res.success && res.token && res.user) {
        if (remember) {
          localStorage.setItem(
            "rememberedUser",
            JSON.stringify({ username: res.user.username, password })
          );
        } else {
          localStorage.removeItem("rememberedUser");
        }

        localStorage.setItem("token", res.token);
        sessionStorage.setItem("currentUser", JSON.stringify(res.user));

        toast.success("Tizimga muvaffaqiyatli kirildi!");

        if (res.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        toast.error(res.error || "Login yoki parol noto'g'ri!");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Tizimga kirishda xatolik yuz berdi!");
    } finally {
      setLoading(false);
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
                  disabled={loading}
                  required
                  placeholder="Loginingizni kiriting"
                  className="pl-10 py-2 w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:bg-gray-50"
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
                  disabled={loading}
                  required
                  placeholder="Parolingizni kiriting"
                  className="pl-10 pr-10 py-2 w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
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
                  disabled={loading}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  Meni eslab qol
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="submit-button group w-full py-2.5 rounded-lg text-white font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center">
                {loading ? (
                  <>
                    Kirilmoqda...
                    <i className="fas fa-spinner fa-spin ml-2"></i>
                  </>
                ) : (
                  <>
                    Kirish
                    <i className="fas fa-sign-in-alt ml-2 group-hover:translate-x-1 transition-transform"></i>
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
