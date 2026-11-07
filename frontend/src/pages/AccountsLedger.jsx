import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  DollarSign,
  Printer,
  Calendar,
  Users,
  Truck,
  Building,
  Receipt,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  X,
  CreditCard,
  Banknote,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { formatPKR, formatDate, formatDateTime } from '../utils/formatters';

export default function AccountsLedger() {
  const [accounts, setAccounts] = useState([]);
  const [grouped, setGrouped] = useState({
    Customer: [],
    Supplier: [],
    Cash: [],
    Bank: [],
    Expense: [],
  });
  const [metrics, setMetrics] = useState({
    totalReceivables: 0,
    totalPayables: 0,
    totalCashInHand: 0,
    totalBankBalance: 0,
    totalExpenses: 0,
  });

  const [activeTab, setActiveTab] = useState('Customer'); // Customer, Supplier, CashBank, Expense
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Ledger Statement Drawer/Modal
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledgerStatement, setLedgerStatement] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  // Modals
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Add Account Form
  const [newAccount, setNewAccount] = useState({
    title: '',
    type: 'Customer',
    phone: '',
    address: '',
    currentBalance: '',
    description: '',
  });

  // Voucher Form
  const [voucherData, setVoucherData] = useState({
    voucherType: 'Receipt_Voucher', // Receipt_Voucher, Payment_Voucher, Expense_Voucher
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    referenceDocNo: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts');
      if (res.data.success) {
        setAccounts(res.data.data);
        setGrouped(res.data.grouped);
        setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Ledger Statement for an Account
  const openLedger = async (account, start = '', end = '') => {
    setSelectedAccount(account);
    setStatementLoading(true);
    try {
      let url = `/accounts/${account._id}/ledger`;
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await api.get(url);
      if (res.data.success) {
        setLedgerStatement(res.data);
      }
    } catch (err) {
      console.error('Failed to load ledger', err);
    } finally {
      setStatementLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/accounts', {
        ...newAccount,
        currentBalance: Number(newAccount.currentBalance) || 0,
      });
      if (res.data.success) {
        setShowAddAccountModal(false);
        setNewAccount({
          title: '',
          type: 'Customer',
          phone: '',
          address: '',
          currentBalance: '',
          description: '',
        });
        fetchAccounts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating account');
    }
  };

  const handlePostVoucher = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/accounts/voucher', voucherData);
      if (res.data.success) {
        setShowVoucherModal(false);
        setVoucherData({
          voucherType: 'Receipt_Voucher',
          fromAccountId: '',
          toAccountId: '',
          amount: '',
          description: '',
          referenceDocNo: '',
          date: new Date().toISOString().split('T')[0],
        });
        fetchAccounts();
        if (selectedAccount) {
          openLedger(selectedAccount, ledgerStartDate, ledgerEndDate);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error posting voucher');
    }
  };

  const cashAndBankAccounts = [...(grouped.Cash || []), ...(grouped.Bank || [])];

  // Set default accounts when voucher type changes
  const handleVoucherTypeChange = (type) => {
    const updated = { ...voucherData, voucherType: type };
    if (type === 'Receipt_Voucher') {
      // from Customer to Cash/Bank
      updated.fromAccountId = grouped.Customer?.[0]?._id || '';
      updated.toAccountId = cashAndBankAccounts?.[0]?._id || '';
    } else if (type === 'Payment_Voucher') {
      // from Cash/Bank to Supplier
      updated.fromAccountId = cashAndBankAccounts?.[0]?._id || '';
      updated.toAccountId = grouped.Supplier?.[0]?._id || '';
    } else if (type === 'Expense_Voucher') {
      // from Cash/Bank to Expense
      updated.fromAccountId = cashAndBankAccounts?.[0]?._id || '';
      updated.toAccountId = grouped.Expense?.[0]?._id || '';
    }
    setVoucherData(updated);
  };

  // Filter current tab accounts
  const getTabAccounts = () => {
    let list = [];
    if (activeTab === 'Customer') list = grouped.Customer || [];
    else if (activeTab === 'Supplier') list = grouped.Supplier || [];
    else if (activeTab === 'CashBank') list = [...(grouped.Cash || []), ...(grouped.Bank || [])];
    else if (activeTab === 'Expense') list = grouped.Expense || [];

    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter(
      (a) => a.title.toLowerCase().includes(q) || (a.phone && a.phone.includes(q))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Voucher Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-400" />
            Chart of Accounts & Khata Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Double-entry running ledger statements, customer receivables, supplier payables & vouchers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              handleVoucherTypeChange('Receipt_Voucher');
              setShowVoucherModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Post Voucher
          </button>
          <button
            onClick={() => setShowAddAccountModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition"
          >
            <Plus className="h-4 w-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Financial Position Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <ArrowUpRight className="h-3.5 w-3.5" /> Total Receivables
          </div>
          <div className="text-xl font-extrabold font-mono text-white mt-1">
            {formatPKR(metrics.totalReceivables)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Customer Khata Dues</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <ArrowDownLeft className="h-3.5 w-3.5" /> Total Payables
          </div>
          <div className="text-xl font-extrabold font-mono text-white mt-1">
            {formatPKR(metrics.totalPayables)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Supplier Balance Owed</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5" /> Cash in Hand
          </div>
          <div className="text-xl font-extrabold font-mono text-emerald-400 mt-1">
            {formatPKR(metrics.totalCashInHand)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Counter Drawer Balance</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5" /> Bank Balances
          </div>
          <div className="text-xl font-extrabold font-mono text-blue-300 mt-1">
            {formatPKR(metrics.totalBankBalance)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">POS Merchant Accounts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5" /> Recorded Expenses
          </div>
          <div className="text-xl font-extrabold font-mono text-purple-300 mt-1">
            {formatPKR(metrics.totalExpenses)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Operational Outlays</div>
        </div>
      </div>

      {/* Main Accounts Explorer & Ledger Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Account Type Tabs & Account Cards (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[700px]">
          {/* Tab Navigation */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 grid grid-cols-4 gap-1 text-xs">
            <button
              onClick={() => setActiveTab('Customer')}
              className={`py-2 px-1 rounded-xl font-semibold flex flex-col items-center gap-1 transition ${
                activeTab === 'Customer'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Customers</span>
            </button>
            <button
              onClick={() => setActiveTab('Supplier')}
              className={`py-2 px-1 rounded-xl font-semibold flex flex-col items-center gap-1 transition ${
                activeTab === 'Supplier'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Suppliers</span>
            </button>
            <button
              onClick={() => setActiveTab('CashBank')}
              className={`py-2 px-1 rounded-xl font-semibold flex flex-col items-center gap-1 transition ${
                activeTab === 'CashBank'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>Cash/Bank</span>
            </button>
            <button
              onClick={() => setActiveTab('Expense')}
              className={`py-2 px-1 rounded-xl font-semibold flex flex-col items-center gap-1 transition ${
                activeTab === 'Expense'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Expenses</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-slate-800 bg-slate-900">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder={`Search ${activeTab} accounts...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Accounts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
            {getTabAccounts().length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No {activeTab} accounts found.
              </div>
            ) : (
              getTabAccounts().map((acc) => {
                const isSelected = selectedAccount?._id === acc._id;
                return (
                  <div
                    key={acc._id}
                    onClick={() => openLedger(acc, ledgerStartDate, ledgerEndDate)}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-600/15 border border-emerald-500/40 text-white'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                        {acc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {acc.phone || acc.address || acc.description || 'No notes'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-mono font-bold ${
                          acc.type === 'Customer'
                            ? acc.currentBalance > 0
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                            : acc.type === 'Supplier'
                            ? acc.currentBalance < 0
                              ? 'text-amber-400'
                              : 'text-slate-300'
                            : 'text-emerald-400'
                        }`}
                      >
                        {formatPKR(acc.currentBalance)}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {acc.type === 'Customer'
                          ? acc.currentBalance > 0
                            ? 'Receivable'
                            : 'Settled'
                          : acc.type === 'Supplier'
                          ? 'Payable'
                          : 'Balance'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Account Ledger Statement (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[700px]">
          {selectedAccount ? (
            <>
              {/* Ledger Statement Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">
                      {selectedAccount.title}
                    </h3>
                    <span className="text-[10px] uppercase font-semibold tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {selectedAccount.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedAccount.phone ? `Phone: ${selectedAccount.phone} | ` : ''}
                    Current Balance: <strong className="text-emerald-400 font-mono">{formatPKR(selectedAccount.currentBalance)}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Statement</span>
                  </button>
                </div>
              </div>

              {/* Date Filter Bar */}
              <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2 text-xs">
                <span className="text-slate-400">Statement Range:</span>
                <input
                  type="date"
                  value={ledgerStartDate}
                  onChange={(e) => {
                    setLedgerStartDate(e.target.value);
                    openLedger(selectedAccount, e.target.value, ledgerEndDate);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs"
                />
                <span className="text-slate-600">to</span>
                <input
                  type="date"
                  value={ledgerEndDate}
                  onChange={(e) => {
                    setLedgerEndDate(e.target.value);
                    openLedger(selectedAccount, ledgerStartDate, e.target.value);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs"
                />
                {(ledgerStartDate || ledgerEndDate) && (
                  <button
                    onClick={() => {
                      setLedgerStartDate('');
                      setLedgerEndDate('');
                      openLedger(selectedAccount, '', '');
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline ml-2"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Statement Summary Banner */}
              {ledgerStatement && (
                <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Opening Bal</span>
                    <span className="font-mono font-bold text-slate-300">
                      {formatPKR(ledgerStatement.statementSummary?.openingBalance || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Period Debits (+)</span>
                    <span className="font-mono font-bold text-rose-400">
                      {formatPKR(ledgerStatement.statementSummary?.totalDebit || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Period Credits (-)</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatPKR(ledgerStatement.statementSummary?.totalCredit || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Closing Bal</span>
                    <span className="font-mono font-bold text-white">
                      {formatPKR(ledgerStatement.statementSummary?.closingBalance || 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Ledger Statement Table */}
              <div className="flex-1 overflow-y-auto">
                {statementLoading ? (
                  <div className="p-12 text-center text-slate-500 text-xs">
                    Loading ledger statement transactions...
                  </div>
                ) : !ledgerStatement?.transactions || ledgerStatement.transactions.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs">
                    No ledger transactions recorded for this account.
                  </div>
                ) : (
                  <div id="ledger-statement-print">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider font-semibold sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Ref / Narration</th>
                          <th className="py-2.5 px-3 text-right">Debit (+)</th>
                          <th className="py-2.5 px-3 text-right">Credit (-)</th>
                          <th className="py-2.5 px-3 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                        {ledgerStatement.transactions.map((tx) => (
                          <tr key={tx._id} className="hover:bg-slate-800/40 transition">
                            <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                              {formatDate(tx.date)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                                {tx.voucherType}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-sans text-xs text-slate-300">
                              {tx.referenceDocNo && (
                                <span className="font-mono font-bold text-emerald-400 mr-1.5">
                                  [{tx.referenceDocNo}]
                                </span>
                              )}
                              <span>{tx.description}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-rose-300 font-semibold">
                              {tx.debit > 0 ? formatPKR(tx.debit) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                              {tx.credit > 0 ? formatPKR(tx.credit) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-white">
                              {formatPKR(tx.balanceAfter)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <FileSpreadsheet className="h-12 w-12 text-slate-700 mb-3" />
              <h4 className="text-sm font-semibold text-slate-400">No Account Selected</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Select an account from the left list to review its running double-entry ledger statement and transaction history.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Post Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" /> Post Double-Entry Voucher
              </h3>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Voucher Type Tabs */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleVoucherTypeChange('Receipt_Voucher')}
                className={`py-2 px-2 rounded-xl font-semibold border transition ${
                  voucherData.voucherType === 'Receipt_Voucher'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Receipt (Customer)
              </button>
              <button
                type="button"
                onClick={() => handleVoucherTypeChange('Payment_Voucher')}
                className={`py-2 px-2 rounded-xl font-semibold border transition ${
                  voucherData.voucherType === 'Payment_Voucher'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Payment (Supplier)
              </button>
              <button
                type="button"
                onClick={() => handleVoucherTypeChange('Expense_Voucher')}
                className={`py-2 px-2 rounded-xl font-semibold border transition ${
                  voucherData.voucherType === 'Expense_Voucher'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Shop Expense
              </button>
            </div>

            <form onSubmit={handlePostVoucher} className="space-y-3.5 text-xs">
              {/* Account selectors based on voucher type */}
              {voucherData.voucherType === 'Receipt_Voucher' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">From Customer (Credit) *</label>
                    <select
                      required
                      value={voucherData.fromAccountId}
                      onChange={(e) =>
                        setVoucherData({ ...voucherData, fromAccountId: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Customer</option>
                      {grouped.Customer?.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title} (Due: {formatPKR(c.currentBalance)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Receiving Cash/Bank (Debit) *</label>
                    <select
                      required
                      value={voucherData.toAccountId}
                      onChange={(e) =>
                        setVoucherData({ ...voucherData, toAccountId: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Cash/Bank</option>
                      {cashAndBankAccounts.map((cb) => (
                        <option key={cb._id} value={cb._id}>
                          {cb.title} ({formatPKR(cb.currentBalance)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {voucherData.voucherType === 'Payment_Voucher' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Paying Cash/Bank (Credit) *</label>
                    <select
                      required
                      value={voucherData.fromAccountId}
                      onChange={(e) =>
                        setVoucherData({ ...voucherData, fromAccountId: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Cash/Bank</option>
                      {cashAndBankAccounts.map((cb) => (
                        <option key={cb._id} value={cb._id}>
                          {cb.title} ({formatPKR(cb.currentBalance)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">To Supplier (Debit) *</label>
                    <select
                      required
                      value={voucherData.toAccountId}
                      onChange={(e) =>
                        setVoucherData({ ...voucherData, toAccountId: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Supplier</option>
                      {grouped.Supplier?.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.title} (Payable: {formatPKR(Math.abs(s.currentBalance))})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {voucherData.voucherType === 'Expense_Voucher' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Paying Cash/Bank (Credit) *</label>
                    <select
                      required
                      value={voucherData.fromAccountId}
                      onChange={(e) =>
                        setVoucherData({ ...voucherData, fromAccountId: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Cash/Bank</option>
                      {cashAndBankAccounts.map((cb) => (
                        <option key={cb._id} value={cb._id}>
                          {cb.title} ({formatPKR(cb.currentBalance)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Expense Category (Debit) *</label>
                    <select
                      required
                      value={voucherData.toAccountId}
                      onChange={(e) =>
                        setVoucherData({ ...voucherData, toAccountId: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Expense Account</option>
                      {grouped.Expense?.map((ex) => (
                        <option key={ex._id} value={ex._id}>
                          {ex.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Voucher Amount (Rs) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 5000"
                    value={voucherData.amount}
                    onChange={(e) => setVoucherData({ ...voucherData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Voucher Date</label>
                  <input
                    type="date"
                    required
                    value={voucherData.date}
                    onChange={(e) => setVoucherData({ ...voucherData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Doc / Ref / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. CHQ-98421 or REC-004"
                  value={voucherData.referenceDocNo}
                  onChange={(e) =>
                    setVoucherData({ ...voucherData, referenceDocNo: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description / Narration</label>
                <input
                  type="text"
                  placeholder="e.g. Partial cash payment against last invoice"
                  value={voucherData.description}
                  onChange={(e) =>
                    setVoucherData({ ...voucherData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Post Voucher Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-400" /> Create Chart of Account
              </h3>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Account Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Rehman Traders"
                  value={newAccount.title}
                  onChange={(e) => setNewAccount({ ...newAccount, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Account Type *</label>
                  <select
                    value={newAccount.type}
                    onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Customer">Customer (Receivable)</option>
                    <option value="Supplier">Supplier (Payable)</option>
                    <option value="Bank">Bank Account</option>
                    <option value="Cash">Cash Account</option>
                    <option value="Expense">Expense Category</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={newAccount.phone}
                    onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Opening Balance (Rs)</label>
                <input
                  type="number"
                  placeholder="0 (Positive = Receivable/Asset, Negative = Payable)"
                  value={newAccount.currentBalance}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, currentBalance: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Address / Location</label>
                <input
                  type="text"
                  placeholder="Market, City"
                  value={newAccount.address}
                  onChange={(e) => setNewAccount({ ...newAccount, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="Terms, bank account number, or details"
                  value={newAccount.description}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
