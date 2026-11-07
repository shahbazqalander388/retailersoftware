import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ArrowUpDown,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Edit2,
  RefreshCw,
  PlusCircle,
  X,
} from 'lucide-react';
import api from '../services/api';
import { formatPKR, formatPercent } from '../utils/formatters';

export default function InventoryValuation() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({
    totalItemsCount: 0,
    totalStockQty: 0,
    totalStockValueAtCost: 0,
    totalStockValueAtRetail: 0,
    totalExpectedProfit: 0,
    overallExpectedMargin: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Low Stock, Out of Stock, In Stock
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Add Product Form
  const [newProduct, setNewProduct] = useState({
    name: '',
    barcode: '',
    category: 'General',
    costPrice: '',
    salePrice: '',
    stockQty: '',
    minStockAlert: 5,
  });

  // Restock Form
  const [restockData, setRestockData] = useState({
    addQty: '',
    newCostPrice: '',
    newSalePrice: '',
  });

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/inventory-valuation');
      if (res.data.success) {
        setProducts(res.data.data);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load inventory valuation', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/products', newProduct);
      if (res.data.success) {
        setShowAddModal(false);
        setNewProduct({
          name: '',
          barcode: '',
          category: 'General',
          costPrice: '',
          salePrice: '',
          stockQty: '',
          minStockAlert: 5,
        });
        fetchInventory();
        fetchCategories();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const res = await api.post(`/products/${selectedProduct._id}/adjust-stock`, {
        addQty: restockData.addQty || 0,
        newCostPrice: restockData.newCostPrice || undefined,
        newSalePrice: restockData.newSalePrice || undefined,
      });

      if (res.data.success) {
        setShowRestockModal(false);
        setSelectedProduct(null);
        fetchInventory();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating stock');
    }
  };

  const openRestockModal = (product) => {
    setSelectedProduct(product);
    setRestockData({
      addQty: '',
      newCostPrice: product.costPrice,
      newSalePrice: product.salePrice,
    });
    setShowRestockModal(true);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === 'All' || p.category === categoryFilter;

    const matchesStatus =
      statusFilter === 'All' || p.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="h-6 w-6 text-emerald-400" />
            Inventory Valuation & Stock Balances
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time stock valuation at Cost vs. Retail sale prices with low stock alerts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="h-4 w-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Value (At Cost) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Stock Value (Cost)
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-white">
              {formatPKR(summary.totalStockValueAtCost)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {summary.totalStockQty} total units stored in warehouse
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 opacity-60" />
        </div>

        {/* Total Retail Value (At Sale Price) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Total Retail Value (Sale)
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              {formatPKR(summary.totalStockValueAtRetail)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Estimated realizable market value
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500" />
        </div>

        {/* Expected Stock Profit */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Expected Stock Profit
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-purple-300">
              {formatPKR(summary.totalExpectedProfit)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Expected Margin: <strong className="text-purple-300">{formatPercent(summary.overallExpectedMargin)}</strong>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-purple-500 opacity-60" />
        </div>

        {/* Low Stock Alert Count */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Stock Warnings
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-amber-300">
              {summary.lowStockCount + summary.outOfStockCount} Items
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Low: <strong className="text-amber-400">{summary.lowStockCount}</strong> | Out: <strong className="text-rose-400">{summary.outOfStockCount}</strong>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 opacity-60" />
        </div>
      </div>

      {/* Product Valuation Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative w-72">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search product name or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Stock Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock Alert</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          <button
            onClick={fetchInventory}
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1.5"
            title="Refresh Inventory"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Valuation Table */}
        <div className="overflow-x-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No products found matching filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Stock Qty</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Sale Price</th>
                  <th className="py-3 px-4 text-right">Value (At Cost)</th>
                  <th className="py-3 px-4 text-right">Value (At Retail)</th>
                  <th className="py-3 px-4 text-right">Expected Profit</th>
                  <th className="py-3 px-4 text-center w-24">Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                        <span className="text-slate-500">{p.barcode}</span>
                        <span>•</span>
                        <span className="text-slate-400">{p.category}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Out of Stock'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : p.status === 'Low Stock'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-sm text-slate-200">
                      {p.stockQty}
                      <span className="text-[10px] text-slate-500 ml-1">
                        (min {p.minStockAlert})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      {formatPKR(p.costPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200">
                      {formatPKR(p.salePrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-300 font-medium">
                      {formatPKR(p.stockValueAtCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-300 font-semibold">
                      {formatPKR(p.stockValueAtRetail)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-purple-300">
                      {formatPKR(p.expectedProfit)}
                      <div className="text-[10px] text-slate-500 font-normal">
                        Margin: {formatPercent(p.marginPercentage)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openRestockModal(p)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 mx-auto transition"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Restock</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-400" /> Add New Inventory Product
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Product Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nestlé MilkPak 1L"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Barcode / SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 89610011"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Dairy, Beverages, Snacks"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Cost Price (Purchase) (Rs) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="250"
                    value={newProduct.costPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Sale Price (Retail) (Rs) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="300"
                    value={newProduct.salePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, salePrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Initial Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={newProduct.stockQty}
                    onChange={(e) => setNewProduct({ ...newProduct, stockQty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="5"
                    value={newProduct.minStockAlert}
                    onChange={(e) => setNewProduct({ ...newProduct, minStockAlert: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock / Adjust Stock Modal */}
      {showRestockModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">
                  Restock / Update Item
                </h3>
                <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                  {selectedProduct.name} ({selectedProduct.barcode})
                </p>
              </div>
              <button
                onClick={() => setShowRestockModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between">
              <span className="text-slate-400">Current Stock in Hand:</span>
              <span className="font-mono font-bold text-white">{selectedProduct.stockQty} units</span>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Add Quantity to Stock *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 24"
                  value={restockData.addQty}
                  onChange={(e) => setRestockData({ ...restockData, addQty: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Updated Cost Price (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    value={restockData.newCostPrice}
                    onChange={(e) => setRestockData({ ...restockData, newCostPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Updated Sale Price (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    value={restockData.newSalePrice}
                    onChange={(e) => setRestockData({ ...restockData, newSalePrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
