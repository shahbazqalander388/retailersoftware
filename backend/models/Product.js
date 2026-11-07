const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      unique: true,
      index: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
      default: 'General',
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    salePrice: {
      type: Number,
      required: [true, 'Sale price is required'],
      min: [0, 'Sale price cannot be negative'],
    },
    stockQty: {
      type: Number,
      default: 0,
    },
    minStockAlert: {
      type: Number,
      default: 5,
      min: [0, 'Min stock alert cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for expected profit per unit
productSchema.virtual('unitProfit').get(function () {
  return this.salePrice - this.costPrice;
});

module.exports = mongoose.model('Product', productSchema);
