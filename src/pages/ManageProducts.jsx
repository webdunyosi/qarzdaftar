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

  const [sellerTypes, setSellerTypes] = useState([]);
  const [newTypeName, setNewTypeName] = useState("");

  useEffect(() => {
    if (!loggedUser) {
      navigate("/login");
      return;
    }

    // Load products list for user's type
    const savedProducts = localStorage.getItem(`product_suggestions_${loggedUser.type}`);
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts).products);
      } catch (e) {
        console.error(e);
        const defaults = getProductSuggestionsDefault(loggedUser.type);
        setProducts(defaults.products);
      }
    } else {
      const defaults = getProductSuggestionsDefault(loggedUser.type);
      setProducts(defaults.products);
    }

    // Load all seller types from API
    const loadTypes = async () => {
      const res = await api.get("/seller-types");
      if (!res.error) {
        setSellerTypes(res);
      }
    };
    loadTypes();
  }, [navigate, loggedUser]);

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

  // Add new seller type
  const handleAddType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    if (sellerTypes.includes(newTypeName.trim())) {
      toast.error("Bunday sotuvchi turi allaqachon mavjud!");
      return;
    }

    const res = await api.post("/seller-types", { name: newTypeName.trim() });
    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Yangi tur muvaffaqiyatli qo'shildi!");
    setNewTypeName("");
    // Reload types
    const updatedTypes = await api.get("/seller-types");
    if (!updatedTypes.error) {
      setSellerTypes(updatedTypes);
    }
  };

  // Delete a seller type
  const handleDeleteType = async (typeName) => {
    if (window.confirm(`"${typeName}" sotuvchi turini o'chirib tashlamoqchimisiz?`)) {
      const res = await api.delete(`/seller-types/${typeName}`);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Sotuvchi turi o'chirildi!");
      // Reload types
      const updatedTypes = await api.get("/seller-types");
      if (!updatedTypes.error) {
        setSellerTypes(updatedTypes);
      }
    }
  };

  const currentIcon = getProductSuggestionsDefault(loggedUser?.type).icon;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 pt-4 px-4 md:px-8 animate-fade-in">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-800 transition cursor-pointer"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Mahsulotlar va turlar
            </h1>
            <p className="text-xs text-slate-400">Mahsulot ro'yxatlari va do'kon sohalarini boshqarish</p>
          </div>
        </div>

        {/* Section 1: Product names management */}
        <div className="glass-card-premium rounded-3xl p-6 shadow-sm border border-white bg-white/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <i className={`fas ${currentIcon} text-blue-500`}></i>
              Mahsulot nomlarini boshqarish
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2.5 py-1">
              {loggedUser?.type || "Kiyim-kechak"}
            </span>
          </div>

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
          <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto pr-1">
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

        {/* Section 2: Manage Seller Types */}
        <div className="glass-card-premium rounded-3xl p-6 shadow-sm border border-white bg-white/80 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <i className="fas fa-store text-blue-500"></i>
              Sotuvchi sohalari (Turlari)
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Sotuvchilar ro'yxatdan o'tishi uchun do'kon turlari</p>
          </div>

          {/* Add seller type form */}
          <form onSubmit={handleAddType} className="flex gap-2">
            <input
              type="text"
              className="flex-1 glass-input py-2 text-sm"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Yangi do'kon turi nomi"
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

          {/* Seller types list */}
          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {sellerTypes.map((type, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100/80 shadow-sm animate-slide-up">
                <span className="text-slate-700 font-semibold text-sm">{type}</span>
                <button
                  onClick={() => handleDeleteType(type)}
                  className="w-8 h-8 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center cursor-pointer transition"
                >
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
