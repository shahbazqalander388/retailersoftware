const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Account = require('./models/Account');
const Transaction = require('./models/Transaction');
const Sale = require('./models/Sale');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/retail_erp';

const seedAccounts = [
  {
    title: 'Cash in Hand',
    type: 'Cash',
    phone: '',
    address: 'Store Front Counter',
    currentBalance: 50000, // Rs. 50,000 initial cash drawer float
    description: 'Main retail counter cash drawer',
  },
  {
    title: 'Meezan Bank (POS Account)',
    type: 'Bank',
    phone: '021-111-331-332',
    address: 'I.I. Chundrigar Road Branch',
    currentBalance: 150000, // Rs. 150,000 bank deposit
    description: 'Primary digital POS merchant receiving account',
  },
  {
    title: 'Shop Operational Expense',
    type: 'Expense',
    phone: '',
    address: '',
    currentBalance: 0,
    description: 'Utility bills, generator fuel, tea & general maintenance',
  },
  {
    title: 'Muhammad Usman (Wholesale Buyer)',
    type: 'Customer',
    phone: '0300-1234567',
    address: 'Gulberg III, Lahore',
    currentBalance: 8500, // Rs. 8,500 existing receivable
    description: 'Regular credit client (B2B)',
  },
  {
    title: 'Tariq Mehmood (Retail Regular)',
    type: 'Customer',
    phone: '0321-9876543',
    address: 'DHA Phase 5, Lahore',
    currentBalance: 0,
    description: 'Frequent retail consumer',
  },
  {
    title: 'Al-Madina FMCG Distributors',
    type: 'Supplier',
    phone: '042-35891234',
    address: 'Circular Road, Lahore',
    currentBalance: -45000, // Negative = Payable Rs. 45,000 owed
    description: 'Primary grocery & beverages distributor',
  },
];

const seedProducts = [
  {
    name: 'Olpers Milk 1 Litre Tetra Pak',
    barcode: '89610001',
    category: 'Dairy',
    costPrice: 245,
    salePrice: 290,
    stockQty: 85,
    minStockAlert: 15,
  },
  {
    name: 'Tapal Danedar Tea 450g',
    barcode: '89610002',
    category: 'Beverages',
    costPrice: 580,
    salePrice: 680,
    stockQty: 40,
    minStockAlert: 10,
  },
  {
    name: 'Dalda Cooking Oil 5 Litre Can',
    barcode: '89610003',
    category: 'Cooking Essentials',
    costPrice: 2450,
    salePrice: 2750,
    stockQty: 25,
    minStockAlert: 5,
  },
  {
    name: 'Shan Biryani Masala 50g Box',
    barcode: '89610004',
    category: 'Spices',
    costPrice: 95,
    salePrice: 130,
    stockQty: 120,
    minStockAlert: 20,
  },
  {
    name: 'Guard Basmati Rice 5kg Bag',
    barcode: '89610005',
    category: 'Grains & Pulses',
    costPrice: 1650,
    salePrice: 1950,
    stockQty: 30,
    minStockAlert: 8,
  },
  {
    name: 'National Tomato Ketchup 800g Pouch',
    barcode: '89610006',
    category: 'Condiments',
    costPrice: 380,
    salePrice: 450,
    stockQty: 50,
    minStockAlert: 10,
  },
  {
    name: 'LU Oreo Biscuits Family Pack',
    barcode: '89610007',
    category: 'Snacks & Biscuits',
    costPrice: 140,
    salePrice: 180,
    stockQty: 60,
    minStockAlert: 15,
  },
  {
    name: 'Surf Excel Washing Powder 1kg',
    barcode: '89610008',
    category: 'Household',
    costPrice: 490,
    salePrice: 590,
    stockQty: 4, // Intentionally low stock to trigger alert
    minStockAlert: 10,
  },
  {
    name: 'Head & Shoulders Shampoo 360ml',
    barcode: '89610009',
    category: 'Personal Care',
    costPrice: 620,
    salePrice: 780,
    stockQty: 0, // Intentionally out of stock to trigger alert
    minStockAlert: 5,
  },
  {
    name: 'Rooh Afza Syrup 800ml Bottle',
    barcode: '89610010',
    category: 'Beverages',
    costPrice: 340,
    salePrice: 420,
    stockQty: 45,
    minStockAlert: 12,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected to MongoDB at', MONGO_URI);

    // Clear existing collections
    await Product.deleteMany({});
    await Account.deleteMany({});
    await Transaction.deleteMany({});
    await Sale.deleteMany({});
    console.log('[Seed] Cleared existing products, accounts, transactions, and sales');

    // Insert Accounts
    const createdAccounts = await Account.insertMany(seedAccounts);
    console.log(`[Seed] Inserted ${createdAccounts.length} Chart of Accounts`);

    const cashAccount = createdAccounts.find((a) => a.type === 'Cash');
    const bankAccount = createdAccounts.find((a) => a.type === 'Bank');
    const customerUsman = createdAccounts.find((a) => a.title.includes('Usman'));
    const customerTariq = createdAccounts.find((a) => a.title.includes('Tariq'));
    const supplierAlMadina = createdAccounts.find((a) => a.type === 'Supplier');

    // Create Initial Opening Balance Transactions for Accounts with balance
    for (const acc of createdAccounts) {
      if (acc.currentBalance !== 0) {
        await Transaction.create({
          account: acc._id,
          voucherType: acc.type === 'Supplier' ? 'Payment_Voucher' : 'Receipt_Voucher',
          referenceDocNo: 'INIT-BAL',
          description: `Opening Balance Float for ${acc.title}`,
          debit: acc.currentBalance > 0 ? acc.currentBalance : 0,
          credit: acc.currentBalance < 0 ? Math.abs(acc.currentBalance) : 0,
          balanceAfter: acc.currentBalance,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        });
      }
    }

    // Insert Products
    const createdProducts = await Product.insertMany(seedProducts);
    console.log(`[Seed] Inserted ${createdProducts.length} retail products`);

    // Create sample sales so Reports have live historical data
    const pMilk = createdProducts.find((p) => p.barcode === '89610001');
    const pTea = createdProducts.find((p) => p.barcode === '89610002');
    const pOil = createdProducts.find((p) => p.barcode === '89610003');
    const pBiryani = createdProducts.find((p) => p.barcode === '89610004');
    const pRice = createdProducts.find((p) => p.barcode === '89610005');

    // Sample Invoice 1: Yesterday Cash Sale
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const item1 = {
      product: pMilk._id,
      name: pMilk.name,
      barcode: pMilk.barcode,
      qty: 2,
      costPrice: pMilk.costPrice,
      salePrice: pMilk.salePrice,
      itemDiscount: 0,
      totalCost: 2 * pMilk.costPrice,
      totalSale: 2 * pMilk.salePrice,
      grossProfit: 2 * pMilk.salePrice - 2 * pMilk.costPrice,
    };
    const item2 = {
      product: pTea._id,
      name: pTea.name,
      barcode: pTea.barcode,
      qty: 1,
      costPrice: pTea.costPrice,
      salePrice: pTea.salePrice,
      itemDiscount: 30,
      totalCost: 1 * pTea.costPrice,
      totalSale: 1 * pTea.salePrice - 30,
      grossProfit: 1 * pTea.salePrice - 30 - 1 * pTea.costPrice,
    };

    const subTotal1 = item1.totalSale + item2.totalSale;
    const totalCOGS1 = item1.totalCost + item2.totalCost;
    const billDiscount1 = 0;
    const grandTotal1 = subTotal1 - billDiscount1;
    const netGP1 = grandTotal1 - totalCOGS1;

    const sale1 = await Sale.create({
      invoiceNo: 'INV-1001',
      customer: customerTariq._id,
      items: [item1, item2],
      subTotal: subTotal1,
      billDiscount: billDiscount1,
      grandTotal: grandTotal1,
      totalCOGS: totalCOGS1,
      netGP: netGP1,
      paymentMethod: 'Cash',
      paidAmount: grandTotal1,
      changeReturned: 0,
      createdAt: yesterday,
    });

    await Transaction.create({
      account: cashAccount._id,
      voucherType: 'POS_Sale',
      referenceId: sale1._id,
      referenceDocNo: 'INV-1001',
      description: 'Cash received for Invoice #INV-1001',
      debit: grandTotal1,
      credit: 0,
      balanceAfter: cashAccount.currentBalance + grandTotal1,
      date: yesterday,
    });
    cashAccount.currentBalance += grandTotal1;
    await cashAccount.save();

    // Sample Invoice 2: Today Credit Sale
    const today = new Date();
    const item3 = {
      product: pOil._id,
      name: pOil.name,
      barcode: pOil.barcode,
      qty: 1,
      costPrice: pOil.costPrice,
      salePrice: pOil.salePrice,
      itemDiscount: 50,
      totalCost: 1 * pOil.costPrice,
      totalSale: 1 * pOil.salePrice - 50,
      grossProfit: 1 * pOil.salePrice - 50 - 1 * pOil.costPrice,
    };
    const item4 = {
      product: pRice._id,
      name: pRice.name,
      barcode: pRice.barcode,
      qty: 2,
      costPrice: pRice.costPrice,
      salePrice: pRice.salePrice,
      itemDiscount: 0,
      totalCost: 2 * pRice.costPrice,
      totalSale: 2 * pRice.salePrice,
      grossProfit: 2 * pRice.salePrice - 2 * pRice.costPrice,
    };

    const subTotal2 = item3.totalSale + item4.totalSale;
    const totalCOGS2 = item3.totalCost + item4.totalCost;
    const billDiscount2 = 100;
    const grandTotal2 = subTotal2 - billDiscount2;
    const netGP2 = grandTotal2 - totalCOGS2;

    const sale2 = await Sale.create({
      invoiceNo: 'INV-1002',
      customer: customerUsman._id,
      items: [item3, item4],
      subTotal: subTotal2,
      billDiscount: billDiscount2,
      grandTotal: grandTotal2,
      totalCOGS: totalCOGS2,
      netGP: netGP2,
      paymentMethod: 'Credit',
      paidAmount: 0,
      changeReturned: 0,
      createdAt: today,
    });

    await Transaction.create({
      account: customerUsman._id,
      voucherType: 'POS_Sale',
      referenceId: sale2._id,
      referenceDocNo: 'INV-1002',
      description: 'Credit balance for Invoice #INV-1002',
      debit: grandTotal2,
      credit: 0,
      balanceAfter: customerUsman.currentBalance + grandTotal2,
      date: today,
    });
    customerUsman.currentBalance += grandTotal2;
    await customerUsman.save();

    console.log('[Seed] Created sample invoices INV-1001 and INV-1002 with ledger entries');
    console.log('[Seed] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
}

seed();
