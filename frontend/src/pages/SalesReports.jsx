import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  DollarSign,
  Printer,
  Eye,
  CheckCircle2,
  Calendar,
  CreditCard,
  Banknote,
  Building2,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { formatPKR, formatDateTime, formatDate } from '../utils/formatters';
import ThermalReceiptModal from '../components/ThermalReceiptModal';

export default function SalesReports() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    totalGrossSales: 0,
    totalDiscount: 0,
    totalNetSales: 0,
    totalCOGS: 0,
    totalNetGP: 0,
    breakdown: {
      cash: { count: 0, amount: 0 },
      bank: { count: 0, amount: 0 },
      credit: { count: 0, amount: 0 },
    },
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [searchInvoice, setSearchInvoice] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingSale, setViewingSale] = useState(null);

  useEffect(() => {
    fetchSales();
  }, [paymentMethod]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      let url = '/reports/sales';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (paymentMethod && paymentMethod !== 'All') {
        params.append('paymentMethod', paymentMethod);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await api.get(url);
      if (res.data.success) {
        setSales(res.data.data);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load sales report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchSales();
  };

  const filteredSales = sales.filter((s) => {
    if (!searchInvoice.trim()) return true;
    const q = searchInvoice.toLowerCase().trim();
    return (
      s.invoiceNo.toLowerCase().includes(q) ||
      (s.customer && s.customer.title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-400" />
            Sales Invoices & Registers
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit itemized invoices, discounts, and payment receipts
          </p>
        </div>

        {/* Filter Controls */}
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Payment Method Filter */}
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="All">All Payment Methods</option>
            <option value="Cash">Cash Only</option>
            <option value="Bank">Bank / POS</option>
            <option value="Credit">Khata / Credit</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-800">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none"
            />
            <span className="text-slate-600">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/20 transition"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Invoices
          </div>
          <div className="text-2xl font-extrabold font-mono text-white mt-1">
            {summary.totalInvoices}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Gross Subtotal: {formatPKR(summary.totalGrossSales)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Net Sales Revenue
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
            {formatPKR(summary.totalNetSales)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Total Discounts: {formatPKR(summary.totalDiscount)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5" /> Cash Received
          </div>
          <div className="text-2xl font-extrabold font-mono text-blue-300 mt-1">
            {formatPKR(summary.breakdown?.cash?.amount || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.breakdown?.cash?.count || 0} Cash Transactions
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Credit & Bank
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-300 mt-1">
            {formatPKR((summary.breakdown?.credit?.amount || 0) + (summary.breakdown?.bank?.amount || 0))}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Credit: {formatPKR(summary.breakdown?.credit?.amount || 0)} | Bank: {formatPKR(summary.breakdown?.bank?.amount || 0)}
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Invoice # or Customer name..."
              value={searchInvoice}
              onChange={(e) => setSearchInvoice(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={fetchSales}
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1.5"
            title="Refresh Invoices"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredSales.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No sales invoices found matching query.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Discount</th>
                  <th className="py-3 px-4 text-right">Net Grand Total</th>
                  <th className="py-3 px-4 text-right">Gross Profit (GP)</th>
                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {sale.invoiceNo}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      {sale.customer ? (
                        <div>
                          <div className="font-semibold text-white">{sale.customer.title}</div>
                          {sale.customer.phone && (
                            <div className="text-[10px] text-slate-500">{sale.customer.phone}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Walk-in Counter</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.paymentMethod === 'Cash'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : sale.paymentMethod === 'Bank'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                      {sale.items?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-300">
                      {sale.billDiscount > 0 ? `-${formatPKR(sale.billDiscount)}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                      {formatPKR(sale.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatPKR(sale.netGP)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setViewingSale(sale)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition font-semibold text-xs flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View / Print Receipt Modal */}
      {viewingSale && (
        <ThermalReceiptModal
          sale={viewingSale}
          onClose={() => setViewingSale(null)}
        />
      )}
    </div>
  );
}
