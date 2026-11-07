const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    barcode: {
      type: String,
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    costPrice: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    itemDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Item discount cannot be negative'],
    },
    totalCost: {
      type: Number,
      required: true,
    },
    totalSale: {
      type: Number,
      required: true,
    },
    grossProfit: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    items: [saleItemSchema],
    subTotal: {
      type: Number,
      required: true,
    },
    billDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Bill discount cannot be negative'],
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    totalCOGS: {
      type: Number,
      required: true,
    },
    netGP: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank', 'Credit'],
      default: 'Cash',
      required: true,
    },
    bankAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    changeReturned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

saleSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Sale', saleSchema);
