const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// Helper to generate next sequential invoice number
async function generateInvoiceNo() {
  const lastSale = await Sale.findOne().sort({ createdAt: -1 });
  if (!lastSale || !lastSale.invoiceNo) {
    return 'INV-1001';
  }
  const match = lastSale.invoiceNo.match(/INV-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `INV-${nextNum}`;
  }
  return `INV-${Date.now().toString().slice(-6)}`;
}

// POST /api/pos/checkout - Execute atomic checkout workflow
router.post('/checkout', async (req, res) => {
  try {
    const {
      customerId,
      items,
      billDiscount = 0,
      paymentMethod = 'Cash',
      bankAccountId,
      paidAmount = 0,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    if (paymentMethod === 'Credit' && !customerId) {
      return res.status(400).json({
        success: false,
        message: 'A registered customer must be selected for Credit sales',
      });
    }

    // 1. Fetch current product snapshots and validate stock
    const productIds = items.map((i) => i.productId || i.product);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map();
    dbProducts.forEach((p) => productMap.set(p._id.toString(), p));

    let subTotal = 0;
    let totalCOGS = 0;
    const processedItems = [];

    for (const item of items) {
      const pid = (item.productId || item.product).toString();
      const product = productMap.get(pid);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${pid} not found in inventory`,
        });
      }

      const qty = Number(item.qty);
      if (qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`,
        });
      }

      const costPrice = Number(product.costPrice);
      const salePrice = item.salePrice !== undefined ? Number(item.salePrice) : Number(product.salePrice);
      const itemDiscount = Number(item.itemDiscount || 0);

      const totalCost = qty * costPrice;
      const totalSale = Math.max(0, qty * salePrice - itemDiscount);
      const grossProfit = totalSale - totalCost;

      subTotal += qty * salePrice;
      totalCOGS += totalCost;

      processedItems.push({
        product: product._id,
        name: product.name,
        barcode: product.barcode,
        qty,
        costPrice,
        salePrice,
        itemDiscount,
        totalCost,
        totalSale,
        grossProfit,
      });
    }

    const numericBillDiscount = Math.max(0, Number(billDiscount) || 0);
    // grandTotal (Net Sale) = sum of line totalSales - billDiscount
    const sumLineTotalSales = processedItems.reduce((acc, i) => acc + i.totalSale, 0);
    const grandTotal = Math.max(0, sumLineTotalSales - numericBillDiscount);
    const netGP = grandTotal - totalCOGS;

    let tenderedAmount = Number(paidAmount) || 0;
    let actualPaid = 0;
    let changeReturned = 0;

    if (paymentMethod === 'Cash') {
      if (tenderedAmount >= grandTotal) {
        actualPaid = grandTotal;
        changeReturned = tenderedAmount - grandTotal;
      } else {
        actualPaid = tenderedAmount;
        changeReturned = 0;
      }
    } else if (paymentMethod === 'Bank') {
      actualPaid = grandTotal;
      tenderedAmount = grandTotal;
      changeReturned = 0;
    } else if (paymentMethod === 'Credit') {
      actualPaid = Math.min(tenderedAmount, grandTotal);
      changeReturned = 0;
    }

    const unpaidBalance = grandTotal - actualPaid;

    // 2. Generate Invoice No & Create Sale Document
    const invoiceNo = await generateInvoiceNo();

    const sale = new Sale({
      invoiceNo,
      customer: customerId || null,
      items: processedItems,
      subTotal,
      billDiscount: numericBillDiscount,
      grandTotal,
      totalCOGS,
      netGP,
      paymentMethod,
      bankAccount: bankAccountId || null,
      paidAmount: actualPaid,
      changeReturned,
    });

    await sale.save();

    // 3. Deduct product quantities atomically using Product.bulkWrite()
    const bulkOps = processedItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stockQty: -item.qty } },
      },
    }));
    await Product.bulkWrite(bulkOps);

    // 4. Update Accounts & Insert Ledger Transactions
    // A) Cash Account
    if (paymentMethod === 'Cash' && actualPaid > 0) {
      let cashAccount = await Account.findOne({ type: 'Cash' });
      if (!cashAccount) {
        cashAccount = await Account.create({
          title: 'Cash in Hand',
          type: 'Cash',
          currentBalance: 0,
        });
      }

      cashAccount.currentBalance += actualPaid;
      await cashAccount.save();

      await Transaction.create({
        account: cashAccount._id,
        voucherType: 'POS_Sale',
        referenceId: sale._id,
        referenceDocNo: invoiceNo,
        description: `Cash received for Invoice #${invoiceNo}${
          tenderedAmount > actualPaid ? ` (Tendered: Rs. ${tenderedAmount}, Change: Rs. ${changeReturned})` : ''
        }`,
        debit: actualPaid,
        credit: 0,
        balanceAfter: cashAccount.currentBalance,
        date: sale.createdAt,
      });
    }

    // B) Bank Account
    if (paymentMethod === 'Bank' && actualPaid > 0) {
      let bankAccount = null;
      if (bankAccountId) {
        bankAccount = await Account.findById(bankAccountId);
      }
      if (!bankAccount) {
        bankAccount = await Account.findOne({ type: 'Bank' });
      }
      if (!bankAccount) {
        bankAccount = await Account.create({
          title: 'Main Bank Account',
          type: 'Bank',
          currentBalance: 0,
        });
      }

      bankAccount.currentBalance += actualPaid;
      await bankAccount.save();

      await Transaction.create({
        account: bankAccount._id,
        voucherType: 'POS_Sale',
        referenceId: sale._id,
        referenceDocNo: invoiceNo,
        description: `Bank payment received for Invoice #${invoiceNo} (${bankAccount.title})`,
        debit: actualPaid,
        credit: 0,
        balanceAfter: bankAccount.currentBalance,
        date: sale.createdAt,
      });
    }

    // C) Customer Account (Receivable/Credit ledger)
    if (customerId) {
      const customerAccount = await Account.findById(customerId);
      if (customerAccount) {
        // If there's an unpaid balance or credit sale
        if (unpaidBalance > 0) {
          customerAccount.currentBalance += unpaidBalance;
          await customerAccount.save();

          await Transaction.create({
            account: customerAccount._id,
            voucherType: 'POS_Sale',
            referenceId: sale._id,
            referenceDocNo: invoiceNo,
            description: `Credit balance for Invoice #${invoiceNo} (Net bill: Rs. ${grandTotal}, Paid: Rs. ${actualPaid})`,
            debit: unpaidBalance,
            credit: 0,
            balanceAfter: customerAccount.currentBalance,
            date: sale.createdAt,
          });
        }
      }
    }

    // Populate customer before returning
    const populatedSale = await Sale.findById(sale._id)
      .populate('customer', 'title phone currentBalance')
      .populate('bankAccount', 'title');

    res.status(201).json({
      success: true,
      message: `Invoice #${invoiceNo} generated successfully`,
      data: populatedSale,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/pos/latest-invoice - Get latest invoice for thermal printing / preview
router.get('/latest-invoice', async (req, res) => {
  try {
    const sale = await Sale.findOne()
      .sort({ createdAt: -1 })
      .populate('customer', 'title phone currentBalance');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'No sales found' });
    }
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
