import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";

const getProductSuggestionsDefault = (type) => {
  switch (type) {
    case "Kiyim-kechak":
      return {
        products: ["Shim", "Ko'ylak", "Kurtka", "Kostyum-shim", "T-shirt"],
        icon: "fa-tshirt"
      };
    case "Oziq-ovqat":
      return {
        products: ["Guruch", "Yog'", "Shakar", "Un", "Choy", "Makaron"],
        icon: "fa-apple-alt"
      };
    case "Go'sht mahsulotlari (Tovuq)":
      return {
        products: ["Tovuq go'shti (Butun)", "Tovuq soni", "Tovuq filesi", "Tovuq qanoti", "Tovuq qiymasi"],
        icon: "fa-drumstick-bite"
      };
    case "Maishiy texnika":
      return {
        products: ["Muzlatgich", "Televizor", "Konditsioner", "Kir yuvish mashinasi", "Dazmol", "Changyutgich"],
        icon: "fa-tv"
      };
    default:
      return {
        products: ["Shim", "Ko'ylak", "Kurtka", "Kostyum-shim", "T-shirt"],
        icon: "fa-box"
      };
  }
};

export default function ManageProducts() {
  const navigate = useNavigate();

  // Get logged-in user synchronously
  const loggedUser = (() => {
    try {
      const userStr = sessionStorage.getItem("currentUser");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  })();

  const [products, setProducts] = useState([]);
  const [newProductName, setNewProductName] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    const userStr = sessionStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(userStr);

    // Load products list for user's type
    const savedProducts = localStorage.getItem(`product_suggestions_${user.type}`);
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts).products);
      } catch (e) {
        console.error(e);
        const defaults = getProductSuggestionsDefault(user.type);
        setProducts(defaults.products);
      }
    } else {
      const defaults = getProductSuggestionsDefault(user.type);
      setProducts(defaults.products);
    }
  }, [navigate]);

  // Save current products list to localStorage
  const saveProductsList = (updatedList) => {
    setProducts(updatedList);
    const defaults = getProductSuggestionsDefault(loggedUser?.type);
    localStorage.setItem(
      `product_suggestions_${loggedUser?.type}`,
      JSON.stringify({
        products: updatedList,
        icon: defaults.icon
      })
    );
  };

  // Add a new product name
  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    if (products.includes(newProductName.trim())) {
      toast.error("Bunday mahsulot allaqachon mavjud!");
      return;
    }
    const updated = [...products, newProductName.trim()];
    saveProductsList(updated);
    setNewProductName("");
    toast.success("Yangi mahsulot qo'shildi!");
  };

  // Delete a product name
  const handleDeleteProduct = (indexToDelete) => {
    const updated = products.filter((_, idx) => idx !== indexToDelete);
    saveProductsList(updated);
    toast.success("Mahsulot o'chirildi!");
  };

  // Start editing product name
  const startEditing = (idx, value) => {
    setEditingIndex(idx);
    setEditingValue(value);
  };

  // Save edited product name
  const handleSaveEditProduct = () => {
    if (!editingValue.trim()) return;
    const updated = [...products];
    updated[editingIndex] = editingValue.trim();
    saveProductsList(updated);
    setEditingIndex(null);
    setEditingValue("");
    toast.success("Mahsulot nomi yangilandi!");
  };


  const currentIcon = getProductSuggestionsDefault(loggedUser?.type).icon;

  return (
    <div className="min-h-screen bg-transparent pb-24 pt-4 px-0 sm:px-4 animate-fade-in">
      <div className="max-w-xl mx-auto space-y-5">
        
        {/* Header */}
        <div className="flex items-center gap-4 px-4 sm:px-0">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-800 transition cursor-pointer relative z-10"
          >
            <i className="fas fa-arrow-left pointer-events-none"></i>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight capitalize">
              {loggedUser?.type || "Mahsulotlar"}
            </h1>
            <p className="text-xs text-slate-400">Mahsulot ro'yxatlarini boshqarish</p>
          </div>
        </div>

        {/* Section 1: Product names management */}
        <div className="card-mobile-fullscreen rounded-none sm:rounded-3xl px-4 py-3 sm:p-6 space-y-4 animate-slide-up">

          {/* Add product form */}
          <form onSubmit={handleAddProduct} className="flex gap-2">
            <input
              type="text"
              className="flex-1 glass-input py-2 text-sm"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="Yangi mahsulot nomi"
              required
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <i className="fas fa-plus"></i>
              Qo'shish
            </button>
          </form>

          {/* Products list */}
          <div className="space-y-2 mt-2 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {products.length === 0 ? (
              <p className="text-center text-slate-400 py-6 text-sm">Hali mahsulotlar qo'shilmagan</p>
            ) : (
              products.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100/80 shadow-sm animate-slide-up">
                  {editingIndex === idx ? (
                    <div className="flex-1 flex gap-2 items-center">
                      <input
                        type="text"
                        className="flex-1 glass-input py-1 text-sm"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        required
                      />
                      <button
                        onClick={handleSaveEditProduct}
                        className="bg-green-500 text-white w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition hover:bg-green-600"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="bg-gray-200 text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition hover:bg-gray-300"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-slate-700 font-semibold text-sm">{p}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(idx, p)}
                          className="w-8 h-8 text-blue-500 hover:bg-blue-50 rounded-lg flex items-center justify-center cursor-pointer transition"
                        >
                          <i className="fas fa-pencil-alt text-xs"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(idx)}
                          className="w-8 h-8 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center cursor-pointer transition"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
