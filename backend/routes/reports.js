const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// Helper to construct date match filter
function getDateFilter(startDate, endDate) {
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.createdAt.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt.$lte = end;
    }
  }
  return dateFilter;
}

// GET /api/reports/sales - Itemized invoices and summary metrics
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;
    const match = getDateFilter(startDate, endDate);

    if (paymentMethod && paymentMethod !== 'All') {
      match.paymentMethod = paymentMethod;
    }

    const sales = await Sale.find(match)
      .populate('customer', 'title phone')
      .populate('bankAccount', 'title')
      .sort({ createdAt: -1 });

    // Calculate summary metrics
    let totalInvoices = sales.length;
    let totalGrossSales = 0;
    let totalDiscount = 0;
    let totalNetSales = 0;
    let totalCOGS = 0;
    let totalNetGP = 0;

    let cashSalesAmount = 0;
    let cashSalesCount = 0;
    let bankSalesAmount = 0;
    let bankSalesCount = 0;
    let creditSalesAmount = 0;
    let creditSalesCount = 0;

    for (const sale of sales) {
      totalGrossSales += sale.subTotal || 0;
      const itemDiscounts = sale.items.reduce((acc, it) => acc + (it.itemDiscount || 0), 0);
      totalDiscount += itemDiscounts + (sale.billDiscount || 0);
      totalNetSales += sale.grandTotal || 0;
      totalCOGS += sale.totalCOGS || 0;
      totalNetGP += sale.netGP || 0;

      if (sale.paymentMethod === 'Cash') {
        cashSalesAmount += sale.grandTotal || 0;
        cashSalesCount++;
      } else if (sale.paymentMethod === 'Bank') {
        bankSalesAmount += sale.grandTotal || 0;
        bankSalesCount++;
      } else if (sale.paymentMethod === 'Credit') {
        creditSalesAmount += sale.grandTotal || 0;
        creditSalesCount++;
      }
    }

    res.json({
      success: true,
      summary: {
        totalInvoices,
        totalGrossSales,
        totalDiscount,
        totalNetSales,
        totalCOGS,
        totalNetGP,
        breakdown: {
          cash: { count: cashSalesCount, amount: cashSalesAmount },
          bank: { count: bankSalesCount, amount: bankSalesAmount },
          credit: { count: creditSalesCount, amount: creditSalesAmount },
        },
      },
      data: sales,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/gp - Gross Profit breakdown (Date-wise and Product-wise)
router.get('/gp', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = getDateFilter(startDate, endDate);

    // 1. Overall Summary
    const summaryAgg = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalCOGS: { $sum: '$totalCOGS' },
          grossProfit: { $sum: '$netGP' },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalCOGS: 1,
          grossProfit: 1,
          totalInvoices: 1,
          gpMarginPercentage: {
            $cond: [
              { $gt: ['$totalRevenue', 0] },
              { $multiply: [{ $divide: ['$grossProfit', '$totalRevenue'] }, 100] },
              0,
            ],
          },
        },
      },
    ]);

    const summary = summaryAgg[0] || {
      totalRevenue: 0,
      totalCOGS: 0,
      grossProfit: 0,
      totalInvoices: 0,
      gpMarginPercentage: 0,
    };

    // 2. Date-wise GP Breakdown
    const dateWiseGP = await Sale.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          netSales: { $sum: '$grandTotal' },
          totalCOGS: { $sum: '$totalCOGS' },
          grossProfit: { $sum: '$netGP' },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $project: {
          date: '$_id',
          _id: 0,
          netSales: 1,
          totalCOGS: 1,
          grossProfit: 1,
          invoiceCount: 1,
          gpMarginPercentage: {
            $cond: [
              { $gt: ['$netSales', 0] },
              { $multiply: [{ $divide: ['$grossProfit', '$netSales'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { date: -1 } },
    ]);

    // 3. Product-wise GP Breakdown (unwind items)
    const productWiseGP = await Sale.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          barcode: { $first: '$items.barcode' },
          qtySold: { $sum: '$items.qty' },
          totalRevenue: { $sum: '$items.totalSale' },
          totalCost: { $sum: '$items.totalCost' },
          grossProfit: { $sum: '$items.grossProfit' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $project: {
          productId: '$_id',
          _id: 0,
          name: 1,
          barcode: 1,
          category: {
            $ifNull: [{ $arrayElemAt: ['$productDetails.category', 0] }, 'General'],
          },
          qtySold: 1,
          totalRevenue: 1,
          totalCost: 1,
          grossProfit: 1,
          gpMarginPercentage: {
            $cond: [
              { $gt: ['$totalRevenue', 0] },
              { $multiply: [{ $divide: ['$grossProfit', '$totalRevenue'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { grossProfit: -1 } },
    ]);

    res.json({
      success: true,
      summary,
      dateWiseGP,
      productWiseGP,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/inventory-valuation - Inventory Valuation & Stock Alerts
router.get('/inventory-valuation', async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $project: {
          name: 1,
          barcode: 1,
          category: 1,
          costPrice: 1,
          salePrice: 1,
          stockQty: 1,
          minStockAlert: 1,
          stockValueAtCost: { $multiply: ['$stockQty', '$costPrice'] },
          stockValueAtRetail: { $multiply: ['$stockQty', '$salePrice'] },
          expectedProfit: {
            $subtract: [
              { $multiply: ['$stockQty', '$salePrice'] },
              { $multiply: ['$stockQty', '$costPrice'] },
            ],
          },
          marginPercentage: {
            $cond: [
              { $gt: [{ $multiply: ['$stockQty', '$salePrice'] }, 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      {
                        $subtract: [
                          { $multiply: ['$stockQty', '$salePrice'] },
                          { $multiply: ['$stockQty', '$costPrice'] },
                        ],
                      },
                      { $multiply: ['$stockQty', '$salePrice'] },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
          isLowStock: { $lte: ['$stockQty', '$minStockAlert'] },
          status: {
            $cond: [
              { $lte: ['$stockQty', 0] },
              'Out of Stock',
              {
                $cond: [
                  { $lte: ['$stockQty', '$minStockAlert'] },
                  'Low Stock',
                  'In Stock',
                ],
              },
            ],
          },
        },
      },
      { $sort: { stockQty: 1, name: 1 } },
    ]);

    // Store-wide aggregates
    let totalStockQty = 0;
    let totalStockValueAtCost = 0;
    let totalStockValueAtRetail = 0;
    let totalExpectedProfit = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      totalStockQty += p.stockQty || 0;
      totalStockValueAtCost += p.stockValueAtCost || 0;
      totalStockValueAtRetail += p.stockValueAtRetail || 0;
      totalExpectedProfit += p.expectedProfit || 0;

      if (p.stockQty <= 0) {
        outOfStockCount++;
      } else if (p.stockQty <= p.minStockAlert) {
        lowStockCount++;
      }
    }

    const overallExpectedMargin =
      totalStockValueAtRetail > 0
        ? (totalExpectedProfit / totalStockValueAtRetail) * 100
        : 0;

    res.json({
      success: true,
      summary: {
        totalItemsCount: products.length,
        totalStockQty,
        totalStockValueAtCost,
        totalStockValueAtRetail,
        totalExpectedProfit,
        overallExpectedMargin,
        lowStockCount,
        outOfStockCount,
      },
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
