const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    voucherType: {
      type: String,
      enum: ['POS_Sale', 'Purchase', 'Receipt_Voucher', 'Payment_Voucher', 'Expense_Voucher'],
      required: true,
      index: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referenceDocNo: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    debit: {
      type: Number,
      default: 0,
    },
    credit: {
      type: Number,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ account: 1, date: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
