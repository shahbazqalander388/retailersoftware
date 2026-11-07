const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// GET /api/accounts - List all accounts with optional type filter or grouped
router.get('/', async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = {};

    if (type && type !== 'All') {
      query.type = type;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { phone: searchRegex }];
    }

    const accounts = await Account.find(query).sort({ title: 1 });

    // Group accounts by type for quick dashboard usage
    const grouped = {
      Customer: [],
      Supplier: [],
      Cash: [],
      Bank: [],
      Expense: [],
    };

    let totalReceivables = 0; // Customer positive balance
    let totalPayables = 0; // Supplier balance (represented as payable)
    let totalCashInHand = 0;
    let totalBankBalance = 0;
    let totalExpenses = 0;

    accounts.forEach((acc) => {
      if (grouped[acc.type]) {
        grouped[acc.type].push(acc);
      }
      if (acc.type === 'Customer' && acc.currentBalance > 0) {
        totalReceivables += acc.currentBalance;
      }
      if (acc.type === 'Supplier') {
        // If negative balance represents payable, or if absolute value is owed
        totalPayables += Math.abs(acc.currentBalance);
      }
      if (acc.type === 'Cash') {
        totalCashInHand += acc.currentBalance;
      }
      if (acc.type === 'Bank') {
        totalBankBalance += acc.currentBalance;
      }
      if (acc.type === 'Expense') {
        totalExpenses += acc.currentBalance;
      }
    });

    res.json({
      success: true,
      count: accounts.length,
      data: accounts,
      grouped,
      metrics: {
        totalReceivables,
        totalPayables,
        totalCashInHand,
        totalBankBalance,
        totalExpenses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/accounts - Create new account
router.post('/', async (req, res) => {
  try {
    const { title, type, phone, currentBalance = 0, address, description } = req.body;

    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: 'Account title and type are required',
      });
    }

    const openingBal = Number(currentBalance) || 0;

    const account = new Account({
      title: title.trim(),
      type,
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      description: description ? description.trim() : '',
      currentBalance: openingBal,
    });

    await account.save();

    // If opening balance != 0, create an opening balance transaction
    if (openingBal !== 0) {
      await Transaction.create({
        account: account._id,
        voucherType: type === 'Supplier' ? 'Payment_Voucher' : 'Receipt_Voucher',
        description: `Opening Balance for ${account.title}`,
        debit: openingBal > 0 ? openingBal : 0,
        credit: openingBal < 0 ? Math.abs(openingBal) : 0,
        balanceAfter: openingBal,
        date: new Date(),
      });
    }

    res.status(201).json({ success: true, data: account });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/accounts/:id - Update account info
router.put('/:id', async (req, res) => {
  try {
    const { title, phone, address, description } = req.body;
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      {
        title: title?.trim(),
        phone: phone?.trim(),
        address: address?.trim(),
        description: description?.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.json({ success: true, data: account });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/accounts/voucher - Post Receipt, Payment, or Expense Voucher
router.post('/voucher', async (req, res) => {
  try {
    const {
      voucherType, // 'Receipt_Voucher', 'Payment_Voucher', 'Expense_Voucher'
      fromAccountId, // e.g. Customer, Paying Cash/Bank
      toAccountId, // e.g. Receiving Cash/Bank, Supplier, Expense Account
      amount,
      description,
      date = new Date(),
      referenceDocNo = '',
    } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid positive amount is required',
      });
    }

    const voucherDate = new Date(date);

    if (voucherType === 'Receipt_Voucher') {
      // Customer payment: from Customer to Cash/Bank
      // fromAccountId = Customer, toAccountId = Cash/Bank
      const customer = await Account.findById(fromAccountId);
      const cashOrBank = await Account.findById(toAccountId);

      if (!customer || !cashOrBank) {
        return res.status(400).json({
          success: false,
          message: 'Both Customer and Receiving Cash/Bank accounts are required',
        });
      }

      // 1. Debit Cash/Bank (Asset increases)
      cashOrBank.currentBalance += numAmount;
      await cashOrBank.save();

      // 2. Credit Customer (Receivable decreases)
      customer.currentBalance -= numAmount;
      await customer.save();

      // Ledger records
      await Transaction.create({
        account: cashOrBank._id,
        voucherType: 'Receipt_Voucher',
        referenceDocNo,
        description: `Receipt from ${customer.title}: ${description || 'Customer Payment Received'}`,
        debit: numAmount,
        credit: 0,
        balanceAfter: cashOrBank.currentBalance,
        date: voucherDate,
      });

      await Transaction.create({
        account: customer._id,
        voucherType: 'Receipt_Voucher',
        referenceDocNo,
        description: `Payment to ${cashOrBank.title}: ${description || 'Payment Settlement'}`,
        debit: 0,
        credit: numAmount,
        balanceAfter: customer.currentBalance,
        date: voucherDate,
      });

      return res.status(201).json({
        success: true,
        message: `Receipt Voucher of Rs. ${numAmount.toLocaleString()} recorded successfully`,
      });
    }

    if (voucherType === 'Payment_Voucher') {
      // Payment to Supplier: from Cash/Bank to Supplier
      // fromAccountId = Cash/Bank, toAccountId = Supplier
      const cashOrBank = await Account.findById(fromAccountId);
      const supplier = await Account.findById(toAccountId);

      if (!cashOrBank || !supplier) {
        return res.status(400).json({
          success: false,
          message: 'Both Paying Cash/Bank and Supplier accounts are required',
        });
      }

      // 1. Debit Supplier (Payable decreases towards 0 / balance increases)
      supplier.currentBalance += numAmount;
      await supplier.save();

      // 2. Credit Cash/Bank (Asset decreases)
      cashOrBank.currentBalance -= numAmount;
      await cashOrBank.save();

      // Ledger records
      await Transaction.create({
        account: supplier._id,
        voucherType: 'Payment_Voucher',
        referenceDocNo,
        description: `Payment received via ${cashOrBank.title}: ${description || 'Supplier Payment Settled'}`,
        debit: numAmount,
        credit: 0,
        balanceAfter: supplier.currentBalance,
        date: voucherDate,
      });

      await Transaction.create({
        account: cashOrBank._id,
        voucherType: 'Payment_Voucher',
        referenceDocNo,
        description: `Payment made to Supplier ${supplier.title}: ${description || 'Supplier Bill Payment'}`,
        debit: 0,
        credit: numAmount,
        balanceAfter: cashOrBank.currentBalance,
        date: voucherDate,
      });

      return res.status(201).json({
        success: true,
        message: `Payment Voucher of Rs. ${numAmount.toLocaleString()} recorded successfully`,
      });
    }

    if (voucherType === 'Expense_Voucher') {
      // Daily Expense: from Cash/Bank to Expense Account
      // fromAccountId = Cash/Bank, toAccountId = Expense Account
      const cashOrBank = await Account.findById(fromAccountId);
      const expense = await Account.findById(toAccountId);

      if (!cashOrBank || !expense) {
        return res.status(400).json({
          success: false,
          message: 'Both Paying Cash/Bank and Expense Category accounts are required',
        });
      }

      // 1. Debit Expense (Expense increases)
      expense.currentBalance += numAmount;
      await expense.save();

      // 2. Credit Cash/Bank (Asset decreases)
      cashOrBank.currentBalance -= numAmount;
      await cashOrBank.save();

      // Ledger records
      await Transaction.create({
        account: expense._id,
        voucherType: 'Expense_Voucher',
        referenceDocNo,
        description: `Expense incurred via ${cashOrBank.title}: ${description || 'Shop Operational Expense'}`,
        debit: numAmount,
        credit: 0,
        balanceAfter: expense.currentBalance,
        date: voucherDate,
      });

      await Transaction.create({
        account: cashOrBank._id,
        voucherType: 'Expense_Voucher',
        referenceDocNo,
        description: `Expense payment for ${expense.title}: ${description || 'Operational Expense'}`,
        debit: 0,
        credit: numAmount,
        balanceAfter: cashOrBank.currentBalance,
        date: voucherDate,
      });

      return res.status(201).json({
        success: true,
        message: `Expense Voucher of Rs. ${numAmount.toLocaleString()} recorded successfully`,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid voucher type. Supported: Receipt_Voucher, Payment_Voucher, Expense_Voucher',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/accounts/:accountId/ledger - Return full running ledger statement
router.get('/:accountId/ledger', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // 1. Calculate Opening Balance before startDate
    let openingBalance = 0;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const preTransactions = await Transaction.find({
        account: accountId,
        date: { $lt: start },
      }).sort({ date: 1, createdAt: 1 });

      if (preTransactions.length > 0) {
        // Balance after the last transaction before startDate
        openingBalance = preTransactions[preTransactions.length - 1].balanceAfter;
      }
    }

    // 2. Fetch transactions within range
    let query = { account: accountId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const transactions = await Transaction.find(query).sort({ date: 1, createdAt: 1 });

    let currentRunning = openingBalance;
    let periodDebit = 0;
    let periodCredit = 0;

    const statement = transactions.map((tx) => {
      periodDebit += tx.debit;
      periodCredit += tx.credit;

      // In double entry:
      // For Asset/Customer/Cash/Bank: Balance increases with Debit, decreases with Credit
      // For Liability/Supplier: Balance decreases with Credit, increases with Debit (towards 0)
      if (account.type === 'Customer' || account.type === 'Cash' || account.type === 'Bank' || account.type === 'Expense') {
        currentRunning = currentRunning + tx.debit - tx.credit;
      } else if (account.type === 'Supplier') {
        // Negative is payable: Debit increases towards 0 (+), Credit makes it more payable (-)
        currentRunning = currentRunning + tx.debit - tx.credit;
      }

      return {
        _id: tx._id,
        date: tx.date,
        voucherType: tx.voucherType,
        referenceDocNo: tx.referenceDocNo,
        description: tx.description,
        debit: tx.debit,
        credit: tx.credit,
        balanceAfter: currentRunning,
      };
    });

    const closingBalance = transactions.length > 0 ? currentRunning : openingBalance;

    res.json({
      success: true,
      account,
      statementSummary: {
        openingBalance,
        totalDebit: periodDebit,
        totalCredit: periodCredit,
        closingBalance,
        transactionCount: transactions.length,
      },
      transactions: statement,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
