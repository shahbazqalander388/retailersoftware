import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  CreditCard,
  Banknote,
  Building2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Printer,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import { formatPKR, formatPKRCompact } from '../utils/formatters';
import ThermalReceiptModal from '../components/ThermalReceiptModal';

export default function POSScreen() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Cart State
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedBank, setSelectedBank] = useState('');
  const [billDiscount, setBillDiscount] = useState(0);
  const [cashTendered, setCashTendered] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutSuccessSale, setCheckoutSuccessSale] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Quick Customer Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const barcodeInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Load initial products, customers, and banks
  useEffect(() => {
    loadProducts();
    loadAccounts();

    // Auto-focus barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }

    // Global Hotkey handler: F2 to focus barcode, F9 to checkout
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
          barcodeInputRef.current.select();
        }
      }
      if (e.key === 'F9') {
        e.preventDefault();
        handleCheckoutSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCustomer, paymentMethod, cashTendered, billDiscount]);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      if (res.data.success) {
        setCustomers(res.data.grouped.Customer || []);
        const banks = res.data.grouped.Bank || [];
        setBankAccounts(banks);
        if (banks.length > 0) {
          setSelectedBank(banks[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load accounts', err);
    }
  };

  // Live search products by name or barcode
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
    setSearchResults(filtered);
    setShowDropdown(true);
  }, [searchQuery, products]);

  // Handle Barcode Scan / Enter key press
  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchQuery.trim();
      if (!code) return;

      // Find exact barcode match first
      const exactMatch = products.find((p) => p.barcode === code);
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery('');
        setShowDropdown(false);
        return;
      }

      // If only 1 item in search results, add it
      if (searchResults.length === 1) {
        addToCart(searchResults[0]);
        setSearchQuery('');
        setShowDropdown(false);
        return;
      }

      // Or match product name
      const nameMatch = products.find(
        (p) => p.name.toLowerCase() === code.toLowerCase()
      );
      if (nameMatch) {
        addToCart(nameMatch);
        setSearchQuery('');
        setShowDropdown(false);
      } else {
        setErrorMessage(`No product found with barcode or name: "${code}"`);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  // Add product to cart or increment qty
  const addToCart = (product) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product === product._id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const item = updated[existingIndex];
        const newQty = item.qty + 1;
        const totalSale = Math.max(0, newQty * item.salePrice - item.itemDiscount);
        const totalCost = newQty * item.costPrice;
        updated[existingIndex] = {
          ...item,
          qty: newQty,
          totalSale,
          totalCost,
          grossProfit: totalSale - totalCost,
        };
        return updated;
      } else {
        const qty = 1;
        const itemDiscount = 0;
        const totalSale = qty * product.salePrice - itemDiscount;
        const totalCost = qty * product.costPrice;
        return [
          ...prev,
          {
            product: product._id,
            name: product.name,
            barcode: product.barcode,
            category: product.category,
            costPrice: product.costPrice,
            salePrice: product.salePrice,
            stockQty: product.stockQty,
            qty,
            itemDiscount,
            totalSale,
            totalCost,
            grossProfit: totalSale - totalCost,
          },
        ];
      }
    });

    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Update Item Quantity
  const updateQty = (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) return;

    setCart((prev) =>
      prev.map((item) => {
        if (item.product === productId) {
          const totalSale = Math.max(0, qty * item.salePrice - item.itemDiscount);
          const totalCost = qty * item.costPrice;
          return {
            ...item,
            qty,
            totalSale,
            totalCost,
            grossProfit: totalSale - totalCost,
          };
        }
        return item;
      })
    );
  };

  // Update Item Discount
  const updateItemDiscount = (productId, discount) => {
    const disc = Math.max(0, parseFloat(discount) || 0);
    setCart((prev) =>
      prev.map((item) => {
        if (item.product === productId) {
          const totalSale = Math.max(0, item.qty * item.salePrice - disc);
          const totalCost = item.qty * item.costPrice;
          return {
            ...item,
            itemDiscount: disc,
            totalSale,
            totalCost,
            grossProfit: totalSale - totalCost,
          };
        }
        return item;
      })
    );
  };

  // Remove Item from Cart
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product !== productId));
  };

  // Clear Cart
  const clearCart = () => {
    setCart([]);
    setBillDiscount(0);
    setCashTendered('');
    setSelectedCustomer('');
    setPaymentMethod('Cash');
    setErrorMessage('');
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Cart Calculations
  const subTotal = cart.reduce((sum, it) => sum + it.qty * it.salePrice, 0);
  const totalItemDiscount = cart.reduce((sum, it) => sum + it.itemDiscount, 0);
  const numericBillDiscount = Math.max(0, parseFloat(billDiscount) || 0);
  const grandTotal = Math.max(
    0,
    cart.reduce((sum, it) => sum + it.totalSale, 0) - numericBillDiscount
  );
  const totalCOGS = cart.reduce((sum, it) => sum + it.totalCost, 0);
  const netEstimatedGP = grandTotal - totalCOGS;

  // Tender & Change calculation
  const numericCashTendered = parseFloat(cashTendered) || 0;
  const changeToReturn =
    paymentMethod === 'Cash' && numericCashTendered > grandTotal
      ? numericCashTendered - grandTotal
      : 0;

  // Set quick cash amount
  const setQuickCash = (amount) => {
    setCashTendered(amount.toString());
  };

  // Checkout Execution
  const handleCheckoutSubmit = async () => {
    setErrorMessage('');
    if (cart.length === 0) {
      setErrorMessage('Cannot checkout an empty cart');
      return;
    }

    if (paymentMethod === 'Credit' && !selectedCustomer) {
      setErrorMessage('Please select a registered customer for Credit sales');
      return;
    }

    const paid =
      paymentMethod === 'Cash'
        ? numericCashTendered || grandTotal
        : paymentMethod === 'Bank'
        ? grandTotal
        : numericCashTendered; // Partial payment on credit if any

    setLoadingCheckout(true);
    try {
      const payload = {
        customerId: selectedCustomer || null,
        items: cart.map((i) => ({
          productId: i.product,
          qty: i.qty,
          salePrice: i.salePrice,
          itemDiscount: i.itemDiscount,
        })),
        billDiscount: numericBillDiscount,
        paymentMethod,
        bankAccountId: paymentMethod === 'Bank' ? selectedBank : null,
        paidAmount: paid,
      };

      const res = await api.post('/pos/checkout', payload);
      if (res.data.success) {
        setCheckoutSuccessSale(res.data.data);
        clearCart();
        loadProducts(); // refresh updated stock
        loadAccounts(); // refresh updated balances
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Error processing checkout. Please check inputs.'
      );
    } finally {
      setLoadingCheckout(false);
    }
  };

  // Create Quick Customer
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    try {
      const res = await api.post('/accounts', {
        title: newCustomerName.trim(),
        type: 'Customer',
        phone: newCustomerPhone.trim(),
        currentBalance: 0,
      });

      if (res.data.success) {
        const created = res.data.data;
        setCustomers((prev) => [...prev, created]);
        setSelectedCustomer(created._id);
        setShowAddCustomerModal(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create customer');
    }
  };

  return (
    <div className="flex flex-col xl:flex-row h-auto xl:h-[calc(100vh-6.5rem)] gap-5 pb-8 xl:pb-0">
      {/* LEFT COLUMN: Barcode Search & Cart Items Table */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[460px]">
        {/* Top Search & Barcode Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center gap-3 relative">
          <div className="relative flex-1" ref={searchContainerRef}>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Barcode className="h-5 w-5 text-emerald-400" />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Scan Barcode or Type Product Name (Press Enter to add)... [F2]"
              className="w-full pl-11 pr-10 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowDropdown(false);
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}

            {/* Live Search Autocomplete Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-80 overflow-y-auto divide-y divide-slate-800">
                {searchResults.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => {
                      addToCart(product);
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                    className="p-3 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white group-hover:text-emerald-400">
                        {product.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          {product.barcode}
                        </span>
                        <span>{product.category}</span>
                        <span className="text-slate-500">|</span>
                        <span>Stock: <strong className={product.stockQty <= product.minStockAlert ? 'text-amber-400' : 'text-slate-300'}>{product.stockQty}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">
                        {formatPKR(product.salePrice)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Cost: {formatPKR(product.costPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="px-3.5 py-3 rounded-xl border border-slate-700 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-30 disabled:pointer-events-none"
            title="Clear current cart"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </button>
        </div>

        {/* Error banner if any */}
        {errorMessage && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 text-rose-300 px-4 py-2.5 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Cart Items Table */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <div className="h-20 w-20 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-center mb-4 text-slate-600">
                <ShoppingCart className="h-10 w-10" />
              </div>
              <h3 className="text-base font-semibold text-slate-300">Cart is empty</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Scan product barcode with handheld scanner or search by item name above to start billing.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-mono text-emerald-400/80 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                Press F2 at any time to focus barcode scanner
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950/60 sticky top-0 z-10 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-3 text-center">Stock</th>
                  <th className="py-3 px-4 text-center w-36">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right w-28">Discount (Rs)</th>
                  <th className="py-3 px-4 text-right">Line Total</th>
                  <th className="py-3 px-4 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {cart.map((item, index) => (
                  <tr
                    key={item.product}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-500">{index + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-sm text-white">{item.name}</div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                        <span className="text-slate-500">{item.barcode}</span>
                        <span>•</span>
                        <span className="text-slate-500">{item.category}</span>
                        <span>•</span>
                        <span className="text-emerald-400/90 font-medium">
                          GP: {formatPKR(item.grossProfit)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.stockQty <= 0
                            ? 'bg-rose-500/20 text-rose-400'
                            : item.stockQty <= 5
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.stockQty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 w-32 mx-auto">
                        <button
                          onClick={() => updateQty(item.product, item.qty - 1)}
                          disabled={item.qty <= 1}
                          className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateQty(item.product, e.target.value)}
                          className="w-12 bg-transparent text-center font-bold text-sm text-white focus:outline-none"
                        />
                        <button
                          onClick={() => updateQty(item.product, item.qty + 1)}
                          className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-300">
                      {formatPKR(item.salePrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <input
                        type="number"
                        min="0"
                        value={item.itemDiscount === 0 ? '' : item.itemDiscount}
                        placeholder="0"
                        onChange={(e) => updateItemDiscount(item.product, e.target.value)}
                        className="w-20 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-right font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500 transition"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-emerald-400">
                      {formatPKR(item.totalSale)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => removeFromCart(item.product)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Remove Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Cart Bottom Summary Bar */}
        {cart.length > 0 && (
          <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-slate-400">
              <span>
                Total Lines: <strong className="text-white">{cart.length}</strong>
              </span>
              <span>•</span>
              <span>
                Total Qty: <strong className="text-white">{cart.reduce((a, b) => a + b.qty, 0)}</strong>
              </span>
              <span>•</span>
              <span>
                COGS: <strong className="text-slate-300">{formatPKR(totalCOGS)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Estimated Net GP:</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {formatPKR(netEstimatedGP)} ({grandTotal > 0 ? ((netEstimatedGP / grandTotal) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Customer, Payment & Checkout Panel */}
      <div className="w-full xl:w-96 flex-shrink-0 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Customer Selector Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-emerald-400" /> Customer Account
            </label>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
            >
              <Plus className="h-3 w-3" /> Add New
            </button>
          </div>

          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="">Walk-in Customer (General Counter)</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title} ({c.phone || 'No Phone'}) — Due: {formatPKR(c.currentBalance)}
              </option>
            ))}
          </select>

          {selectedCustomer && (
            <div className="mt-2.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Khata Balance:</span>
              <span
                className={`font-mono font-bold ${
                  customers.find((c) => c._id === selectedCustomer)?.currentBalance > 0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {formatPKR(
                  customers.find((c) => c._id === selectedCustomer)?.currentBalance || 0
                )}
              </span>
            </div>
          )}
        </div>

        {/* Bill Calculations Area */}
        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          {/* Subtotal & Line Discounts */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Gross Subtotal</span>
              <span className="font-mono text-slate-200">{formatPKR(subTotal)}</span>
            </div>
            {totalItemDiscount > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Item Level Discounts</span>
                <span className="font-mono">-{formatPKR(totalItemDiscount)}</span>
              </div>
            )}

            {/* Overall Bill Discount */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-300">Bill Discount (Special)</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-mono text-xs">Rs.</span>
                <input
                  type="number"
                  min="0"
                  value={billDiscount === 0 ? '' : billDiscount}
                  placeholder="0"
                  onChange={(e) => setBillDiscount(e.target.value)}
                  className="w-24 px-2 py-1 bg-slate-950 border border-slate-700/80 rounded-lg text-right font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* NET PAYABLE GRAND TOTAL */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-950 border border-emerald-500/30 text-center shadow-inner">
            <div className="text-[11px] uppercase font-bold tracking-widest text-emerald-400 mb-1">
              Net Amount Payable
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-300 tracking-tight">
              {formatPKR(grandTotal)}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                  paymentMethod === 'Cash'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Banknote className="h-4 w-4" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Bank')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                  paymentMethod === 'Bank'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Bank / POS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Credit')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                  paymentMethod === 'Credit'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Khata / Credit</span>
              </button>
            </div>
          </div>

          {/* Bank Account Selector (if Bank payment) */}
          {paymentMethod === 'Bank' && (
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">
                Receiving Bank Account
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {bankAccounts.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} (Balance: {formatPKR(b.currentBalance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cash Tendered & Change (for Cash & Partial Credit) */}
          {paymentMethod !== 'Bank' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 block">
                {paymentMethod === 'Cash' ? 'Cash Received (Tendered)' : 'Advance / Partial Paid'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder={grandTotal.toString()}
                  className="w-full pl-3 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Cash Buttons */}
              {paymentMethod === 'Cash' && grandTotal > 0 && (
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuickCash(grandTotal)}
                    className="py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-300 text-center"
                  >
                    Exact
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCash(500)}
                    className="py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-300 text-center"
                  >
                    Rs 500
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCash(1000)}
                    className="py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-300 text-center"
                  >
                    Rs 1,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCash(5000)}
                    className="py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-slate-300 text-center"
                  >
                    Rs 5,000
                  </button>
                </div>
              )}

              {/* Live Change to Return Indicator */}
              {paymentMethod === 'Cash' && numericCashTendered > grandTotal && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs animate-fadeIn">
                  <span className="text-blue-300 font-semibold">Change to Return:</span>
                  <span className="font-mono text-base font-extrabold text-blue-400">
                    {formatPKR(changeToReturn)}
                  </span>
                </div>
              )}

              {/* Remaining Credit Notice */}
              {paymentMethod === 'Credit' && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                  Remaining Rs. {formatPKR(grandTotal - (parseFloat(cashTendered) || 0))} will be debited to customer khata.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Checkout Button Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850">
          <button
            type="button"
            disabled={cart.length === 0 || loadingCheckout}
            onClick={handleCheckoutSubmit}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition duration-150 disabled:opacity-30 disabled:pointer-events-none"
          >
            {loadingCheckout ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Sale...</span>
              </div>
            ) : (
              <>
                <Printer className="h-4 w-4" />
                <span>Pay & Print Invoice [F9]</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-400" /> Add New Customer
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Haji Abdul Rahman"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="e.g. 0300-1234567"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Modal */}
      {checkoutSuccessSale && (
        <ThermalReceiptModal
          sale={checkoutSuccessSale}
          onClose={() => setCheckoutSuccessSale(null)}
        />
      )}
    </div>
  );
}
