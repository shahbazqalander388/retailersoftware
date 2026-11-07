import React from 'react';
import { Printer, X, CheckCircle, ArrowDownCircle } from 'lucide-react';
import { formatPKR, formatDateTime } from '../utils/formatters';

export default function ThermalReceiptModal({ sale, onClose }) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalItemDiscounts = sale.items?.reduce((acc, it) => acc + (it.itemDiscount || 0), 0) || 0;
  const totalQty = sale.items?.reduce((acc, it) => acc + it.qty, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header (No print) */}
        <div className="no-print p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Sale Completed Successfully</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Receipt Preview (Printable Area) */}
        <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-slate-950">
          <div
            id="thermal-receipt"
            className="w-[80mm] bg-white text-black p-4 font-mono text-[11px] leading-tight shadow-md rounded-sm"
          >
            {/* Store Header */}
            <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-black">
                Apex Supermarket
              </h2>
              <p className="text-[10px] text-gray-700">Commercial Market, DHA, Lahore</p>
              <p className="text-[10px] text-gray-700">Tel: 042-35891234 | NTN: 8945201-3</p>
              <div className="inline-block mt-1 px-2 py-0.5 border border-black text-[9px] font-bold uppercase">
                Tax Invoice / Cash Memo
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Invoice: <strong className="text-black">{sale.invoiceNo}</strong></span>
                <span>Date: {formatDateTime(sale.createdAt || new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment: <strong>{sale.paymentMethod}</strong></span>
                <span>Cashier: POS-01</span>
              </div>
              {sale.customer && (
                <div className="pt-0.5 text-gray-800">
                  <div>Customer: <strong>{sale.customer.title}</strong></div>
                  {sale.customer.phone && <div>Phone: {sale.customer.phone}</div>}
                </div>
              )}
            </div>

            {/* Items Table */}
            <table className="w-full text-left mb-2">
              <thead>
                <tr className="border-b border-black text-[10px]">
                  <th className="py-1">Item</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-right py-1">Rate</th>
                  <th className="text-right py-1">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-gray-300">
                {sale.items?.map((it, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="py-1 pr-1">
                      <div className="font-semibold text-gray-900">{it.name}</div>
                      <div className="text-[9px] text-gray-600">{it.barcode}</div>
                      {it.itemDiscount > 0 && (
                        <div className="text-[9px] text-gray-600">
                          Disc: -{formatPKR(it.itemDiscount)}
                        </div>
                      )}
                    </td>
                    <td className="text-center py-1 font-bold">{it.qty}</td>
                    <td className="text-right py-1">{it.salePrice}</td>
                    <td className="text-right py-1 font-semibold">
                      {(it.totalSale || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations Breakdown */}
            <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Total Items / Qty:</span>
                <span>{sale.items?.length || 0} / {totalQty}</span>
              </div>
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span>{formatPKR(sale.subTotal)}</span>
              </div>
              {totalItemDiscounts > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Item Discounts:</span>
                  <span>-{formatPKR(totalItemDiscounts)}</span>
                </div>
              )}
              {sale.billDiscount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Special Bill Discount:</span>
                  <span>-{formatPKR(sale.billDiscount)}</span>
                </div>
              )}

              {/* Net Grand Total */}
              <div className="flex justify-between border-t border-b-2 border-black py-1 my-1 text-sm font-extrabold">
                <span>NET TOTAL:</span>
                <span>{formatPKR(sale.grandTotal)}</span>
              </div>

              {/* Tendered & Change */}
              <div className="flex justify-between text-[10px]">
                <span>Amount Paid ({sale.paymentMethod}):</span>
                <span>{formatPKR(sale.paidAmount || sale.grandTotal)}</span>
              </div>
              {sale.changeReturned > 0 && (
                <div className="flex justify-between text-[10px] font-bold">
                  <span>Change Returned:</span>
                  <span>{formatPKR(sale.changeReturned)}</span>
                </div>
              )}
              {sale.paymentMethod === 'Credit' && sale.customer && (
                <div className="flex justify-between text-[10px] text-red-700 font-bold border-t border-dotted border-gray-400 pt-1 mt-1">
                  <span>Current Due / Khata:</span>
                  <span>{formatPKR(sale.customer.currentBalance)}</span>
                </div>
              )}
            </div>

            {/* Barcode Mock */}
            <div className="text-center my-3 pt-2 border-t border-dashed border-gray-400">
              <div className="flex justify-center items-end gap-[2px] h-9 overflow-hidden">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2].map(
                  (w, i) => (
                    <div
                      key={i}
                      className="bg-black h-full"
                      style={{ width: `${w}px` }}
                    />
                  )
                )}
              </div>
              <div className="text-[9px] tracking-widest mt-1 text-gray-800">
                *{sale.invoiceNo}*
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] text-gray-600 space-y-0.5">
              <p>Items can be exchanged within 3 days with receipt.</p>
              <p className="font-bold text-gray-900">Thank you for your visit!</p>
              <p>Powered by Apex Retail ERP System</p>
            </div>
          </div>
        </div>

        {/* Action Buttons (No print) */}
        <div className="no-print p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
          >
            Close (Esc)
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
          >
            <Printer className="h-4 w-4" />
            Print 80mm Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
