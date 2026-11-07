import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Percent,
  Layers,
  ArrowUpRight,
  Filter,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { formatPKR, formatDate, formatPercent } from '../utils/formatters';

export default function GPReports() {
  const [dateFilter, setDateFilter] = useState('month'); // today, 7days, month, all, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('datewise'); // 'datewise' or 'itemwise'
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCOGS: 0,
    grossProfit: 0,
    totalInvoices: 0,
    gpMarginPercentage: 0,
  });
  const [dateWiseGP, setDateWiseGP] = useState([]);
  const [productWiseGP, setProductWiseGP] = useState([]);

  useEffect(() => {
    applyPresetDateFilter(dateFilter);
  }, [dateFilter]);

  const applyPresetDateFilter = (preset) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
      fetchData(todayStr, todayStr);
    } else if (preset === '7days') {
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const pastStr = past.toISOString().split('T')[0];
      setStartDate(pastStr);
      setEndDate(todayStr);
      fetchData(pastStr, todayStr);
    } else if (preset === 'month') {
      const firstDay = `${yyyy}-${mm}-01`;
      setStartDate(firstDay);
      setEndDate(todayStr);
      fetchData(firstDay, todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      fetchData('', '');
    }
  };

  const fetchData = async (start, end) => {
    setLoading(true);
    try {
      let url = '/reports/gp';
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await api.get(url);
      if (res.data.success) {
        setSummary(res.data.summary);
        setDateWiseGP(res.data.dateWiseGP || []);
        setProductWiseGP(res.data.productWiseGP || []);
      }
    } catch (err) {
      console.error('Error fetching GP report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFilterSubmit = (e) => {
    e.preventDefault();
    fetchData(startDate, endDate);
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
            Gross Profit (GP) & Margin Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time profitability tracking based on cost of goods sold (COGS) snapshots
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            {['today', '7days', 'month', 'all'].map((preset) => (
              <button
                key={preset}
                onClick={() => setDateFilter(preset)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  dateFilter === preset
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {preset === 'today'
                  ? 'Today'
                  : preset === '7days'
                  ? 'Last 7 Days'
                  : preset === 'month'
                  ? 'This Month'
                  : 'All Time'}
              </button>
            ))}
          </div>

          <form onSubmit={handleCustomFilterSubmit} className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateFilter('custom');
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-600">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateFilter('custom');
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold transition"
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Net Revenue
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-white">
              {formatPKR(summary.totalRevenue)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>{summary.totalInvoices} Invoices billed in period</span>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 opacity-60" />
        </div>

        {/* Total COGS */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total COGS (Cost)
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-slate-200">
              {formatPKR(summary.totalCOGS)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Purchase cost of items sold
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 opacity-60" />
        </div>

        {/* Net Gross Profit */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Net Gross Profit
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              {formatPKR(summary.grossProfit)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Net Sales minus COGS & discounts
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500" />
        </div>

        {/* GP Margin % */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Overall GP Margin
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-purple-300">
              {formatPercent(summary.gpMarginPercentage)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Return on sales revenue
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-purple-500 opacity-60" />
        </div>
      </div>

      {/* Toggle View Tabs: Date-wise GP vs Product-wise Margin */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('datewise')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'datewise'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Date-wise GP Report</span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">
                {dateWiseGP.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('itemwise')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'itemwise'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Item-wise Profit Margin Report</span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">
                {productWiseGP.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => fetchData(startDate, endDate)}
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs flex items-center gap-1.5"
            title="Refresh Report Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* TAB 1: Date-Wise GP Report */}
        {activeTab === 'datewise' && (
          <div className="overflow-x-auto">
            {dateWiseGP.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No sales records found for selected period.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-4 text-center">Invoices</th>
                    <th className="py-3 px-5 text-right">Net Sales (Revenue)</th>
                    <th className="py-3 px-5 text-right">Total COGS (Cost)</th>
                    <th className="py-3 px-5 text-right">Gross Profit (GP)</th>
                    <th className="py-3 px-5 text-right">GP Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {dateWiseGP.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-5 font-semibold text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{formatDate(row.date)}</span>
                        <span className="text-[10px] font-mono text-slate-500">({row.date})</span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {row.invoiceCount}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-medium text-slate-200">
                        {formatPKR(row.netSales)}
                      </td>
                      <td className="py-4 px-5 text-right font-mono text-slate-400">
                        {formatPKR(row.totalCOGS)}
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-emerald-400">
                        {formatPKR(row.grossProfit)}
                      </td>
                      <td className="py-4 px-5 text-right font-mono">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            row.gpMarginPercentage >= 20
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : row.gpMarginPercentage >= 10
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {formatPercent(row.gpMarginPercentage)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: Item-Wise Profit Margin Report */}
        {activeTab === 'itemwise' && (
          <div className="overflow-x-auto">
            {productWiseGP.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No item sales data found for selected period.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-5">#</th>
                    <th className="py-3 px-5">Product Details</th>
                    <th className="py-3 px-4 text-center">Qty Sold</th>
                    <th className="py-3 px-5 text-right">Revenue</th>
                    <th className="py-3 px-5 text-right">Cost (COGS)</th>
                    <th className="py-3 px-5 text-right">Gross Profit (Net)</th>
                    <th className="py-3 px-5 text-right w-48">GP Margin Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {productWiseGP.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-5 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-white">{prod.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span className="text-slate-500">{prod.barcode}</span>
                          <span>•</span>
                          <span className="text-emerald-400/80">{prod.category}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-200">
                        {prod.qtySold}
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-medium text-slate-300">
                        {formatPKR(prod.totalRevenue)}
                      </td>
                      <td className="py-4 px-5 text-right font-mono text-slate-400">
                        {formatPKR(prod.totalCost)}
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-emerald-400">
                        {formatPKR(prod.grossProfit)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                prod.gpMarginPercentage >= 20
                                  ? 'bg-emerald-500'
                                  : prod.gpMarginPercentage >= 10
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, prod.gpMarginPercentage))}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-200 w-12 text-right">
                            {formatPercent(prod.gpMarginPercentage)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
