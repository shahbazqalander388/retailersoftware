const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Account title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Customer', 'Supplier', 'Cash', 'Bank', 'Expense'],
      required: [true, 'Account type is required'],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Account', accountSchema);
