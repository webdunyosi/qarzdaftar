import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import api from "../utils/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import "../styles/diagram.css"; // Ensure styles are imported

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LABELS = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];

const LABELS_SHORT = ["Du", "Se", "Chor", "Pay", "Jum", "Sha", "Yak"];

export default function Diagram() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 640;
  const currentLabels = isMobile ? LABELS_SHORT : LABELS;
  const [chartData, setChartData] = useState({ labels: currentLabels, datasets: [] });
  const [bugungiTushumlar, setBugungiTushumlar] = useState(0);
  const [oylikTushumlar, setOylikTushumlar] = useState(0);

  const formatMoney = (n) => {
    if (n >= 1000000) {
      const val = n / 1000000;
      return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + " MLN";
    }
    return n.toLocaleString("uz-UZ");
  };

  useEffect(() => {
    // Authenticate
    const userStr = sessionStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      // Load debt data from API
      const qarzlar = await api.get("/debts");
      if (qarzlar.error) {
        console.error("Failed to fetch qarzlar:", qarzlar.error);
        return;
      }

      // Calculate today's and monthly receipts (tushumlar)
      const todayLocal = new Date();
      const todayYear = todayLocal.getFullYear();
      const todayMonth = todayLocal.getMonth();
      const todayDate = todayLocal.getDate();

      const isToday = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getFullYear() === todayYear && d.getMonth() === todayMonth && d.getDate() === todayDate;
      };

      const isThisMonth = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getFullYear() === todayYear && d.getMonth() === todayMonth;
      };

      const dailyPaid = qarzlar
        .filter((q) => q.status === "To'langan" && isToday(q.updatedAt || q.sana))
        .reduce((sum, q) => sum + Number(q.qarzMiqdori || 0), 0);

      const monthlyPaid = qarzlar
        .filter((q) => q.status === "To'langan" && isThisMonth(q.updatedAt || q.sana))
        .reduce((sum, q) => sum + Number(q.qarzMiqdori || 0), 0);

      setBugungiTushumlar(dailyPaid);
      setOylikTushumlar(monthlyPaid);

      // Process stats
      const weekStats = {};
      qarzlar.forEach((q) => {
        if (!q.sana) return;
        const parts = q.sana.split("-");
        let weekDay;
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const sana = new Date(year, month, day);
          const dayIdx = sana.getDay();
          weekDay = dayIdx === 0 ? 6 : dayIdx - 1;
        } else {
          const sana = new Date(q.sana);
          const dayIdx = sana.getDay();
          weekDay = dayIdx === 0 ? 6 : dayIdx - 1;
        }
        const mahsulot = q.mahsulot || "Noma'lum";

        if (!weekStats[mahsulot]) {
          weekStats[mahsulot] = [0, 0, 0, 0, 0, 0, 0];
        }
        weekStats[mahsulot][weekDay]++;
      });

      const colors = [
        ["#6366f1", "#818cf8"],
        ["#f472b6", "#f9a8d4"],
        ["#34d399", "#6ee7b7"],
        ["#fbbf24", "#fde68a"],
        ["#60a5fa", "#a5b4fc"],
        ["#f87171", "#fca5a5"],
        ["#a78bfa", "#c4b5fd"],
      ];

      let colorIdx = 0;
      const datasets = Object.entries(weekStats).map(([mahsulot, data]) => {
        const [c1, c2] = colors[colorIdx % colors.length];
        colorIdx++;
        return {
          label: mahsulot,
          data,
          borderColor: c1,
          backgroundColor: "rgba(99, 102, 241, 0.05)",
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: c1,
          pointBorderColor: "#fff",
          pointHoverRadius: 8,
          fill: false,
        };
      });

      // Fallback dataset reflecting empty database state
      if (datasets.length === 0) {
        datasets.push({
          label: "Qarzlar",
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.05)",
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: "#6366f1",
          pointBorderColor: "#fff",
          pointHoverRadius: 8,
          fill: true,
        });
      }

      setChartData({
        labels: currentLabels,
        datasets,
      });
    };

    loadData();
  }, [navigate]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#475569",
          font: {
            size: window.innerWidth < 640 ? 11 : 14,
            weight: "bold",
          },
          usePointStyle: true,
          padding: window.innerWidth < 640 ? 8 : 16,
        },
        position: window.innerWidth < 640 ? "bottom" : "top",
        align: "center",
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#6366f1",
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          size: 13,
        },
        titleFont: {
          size: 14,
          weight: "bold",
        },
        callbacks: {
          label: function (context) {
            return ` ${context.dataset.label}: ${context.parsed.y} ta`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#64748b",
          font: {
            size: window.innerWidth < 640 ? 11 : 13,
          },
          maxRotation: 0,
          minRotation: 0,
        },
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#64748b",
          font: {
            size: window.innerWidth < 640 ? 10 : 13,
          },
          stepSize: 1,
        },
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
    },
  };

  return (
    <div className="diagram-page min-h-screen pb-24">
      <div className="chart-container">
        <div className="chart-content">
          <div className="flex items-center mb-2">
            <i className="fas fa-chart-line text-2xl text-indigo-400 mr-3"></i>
            <span className="chart-title">Qarzlar Statistikasi</span>
          </div>
          <div className="chart-desc">
            Tovarlar bo'yicha kunlik qo'shilgan qarzlar statistikasi.
          </div>
          <div style={{ height: "350px", position: "relative" }}>
            <Line data={chartData} options={options} />
          </div>

          {/* Daily & Monthly Receipts Cards */}
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <div 
              className="bg-white"
              style={{
                flex: 1,
                border: "1px solid #f1f5f9",
                borderLeft: "6px solid #10b981",
                borderRadius: "1rem",
                padding: "1rem",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "95px"
              }}
            >
              <span className="text-xl sm:text-2xl font-black text-emerald-600 block">
                {formatMoney(bugungiTushumlar)}
              </span>
              <div>
                <span className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider block leading-tight">
                  Bugungi tushumlar
                </span>
                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider block mt-0.5">
                  (So'm)
                </span>
              </div>
            </div>

            <div 
              className="bg-white"
              style={{
                flex: 1,
                border: "1px solid #f1f5f9",
                borderLeft: "6px solid #2563eb",
                borderRadius: "1rem",
                padding: "1rem",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "95px"
              }}
            >
              <span className="text-xl sm:text-2xl font-black text-blue-700 block">
                {formatMoney(oylikTushumlar)}
              </span>
              <div>
                <span className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider block leading-tight">
                  Oylik ko'rsatkichlar
                </span>
                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider block mt-0.5">
                  (So'm)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
