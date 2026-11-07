const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - List all products with search & category filter
router.get('/', async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    let query = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { barcode: searchRegex }];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    let products = await Product.find(query).sort({ name: 1 });

    if (lowStock === 'true') {
      products = products.filter((p) => p.stockQty <= p.minStockAlert);
    }

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/categories - Distinct categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id - Single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    const { name, barcode, category, costPrice, salePrice, stockQty, minStockAlert } = req.body;

    const existingBarcode = await Product.findOne({ barcode: barcode?.trim() });
    if (existingBarcode) {
      return res.status(400).json({
        success: false,
        message: `Product with barcode "${barcode}" already exists (${existingBarcode.name})`,
      });
    }

    const product = new Product({
      name: name?.trim(),
      barcode: barcode?.trim(),
      category: category?.trim() || 'General',
      costPrice: Number(costPrice) || 0,
      salePrice: Number(salePrice) || 0,
      stockQty: Number(stockQty) || 0,
      minStockAlert: minStockAlert !== undefined ? Number(minStockAlert) : 5,
    });

    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const { name, barcode, category, costPrice, salePrice, stockQty, minStockAlert } = req.body;

    if (barcode) {
      const existing = await Product.findOne({
        barcode: barcode.trim(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Another product with barcode "${barcode}" already exists`,
        });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: name?.trim(),
        barcode: barcode?.trim(),
        category: category?.trim(),
        costPrice: Number(costPrice),
        salePrice: Number(salePrice),
        stockQty: Number(stockQty),
        minStockAlert: Number(minStockAlert),
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/products/:id/adjust-stock - Quick Restock / Stock Adjustment
router.post('/:id/adjust-stock', async (req, res) => {
  try {
    const { addQty, newCostPrice, newSalePrice, reason } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (addQty !== undefined) {
      product.stockQty += Number(addQty);
    }
    if (newCostPrice !== undefined && Number(newCostPrice) >= 0) {
      product.costPrice = Number(newCostPrice);
    }
    if (newSalePrice !== undefined && Number(newSalePrice) >= 0) {
      product.salePrice = Number(newSalePrice);
    }

    await product.save();
    res.json({ success: true, data: product, message: 'Stock updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
