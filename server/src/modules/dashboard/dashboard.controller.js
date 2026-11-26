import { SalesOrder } from '../sales/salesOrder.model.js';
import { PurchaseOrder } from '../procurement/purchaseOrder.model.js';
import { WorkOrder } from '../production/workOrder.model.js';
import { Invoice } from '../invoicing/invoice.model.js';
import { Product } from '../products/product.model.js';
import { StockBalance } from '../inventory/stockBalance.model.js';
import { QualityInspection } from '../quality/qualityInspection.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { INVOICE_STATUSES, WORK_ORDER_STATUSES, PO_STATUSES, SALES_ORDER_STATUSES } from '../../config/constants.js';

export const getDashboardMetrics = asyncHandler(async (req, res) => {
  const companyId = req.companyId;

  // Concurrent queries for high-performance dashboard loading
  const [
    salesAgg,
    purchasesAgg,
    receivablesAgg,
    activeWO,
    pendingPO,
    pendingSO,
    allProducts,
    allBalances,
    qualityAgg,
    recentSales,
    recentPurchases,
    activeWorkOrdersList,
    overdueInvoices,
  ] = await Promise.all([
    // Total Sales
    Invoice.aggregate([
      { $match: { companyId, status: { $ne: INVOICE_STATUSES.VOIDED } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),

    // Total Purchases
    PurchaseOrder.aggregate([
      {
        $match: {
          companyId,
          status: { $in: [PO_STATUSES.APPROVED, PO_STATUSES.PARTIALLY_RECEIVED, PO_STATUSES.RECEIVED] },
        },
      },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),

    // Outstanding Receivables
    Invoice.aggregate([
      {
        $match: {
          companyId,
          status: { $in: [INVOICE_STATUSES.POSTED, INVOICE_STATUSES.PARTIALLY_PAID] },
        },
      },
      { $group: { _id: null, total: { $sum: '$balanceDue' } } },
    ]),

    // Active Work Orders Count
    WorkOrder.countDocuments({
      companyId,
      status: { $in: [WORK_ORDER_STATUSES.RELEASED, WORK_ORDER_STATUSES.IN_PROGRESS] },
    }),

    // Pending PO Count
    PurchaseOrder.countDocuments({
      companyId,
      status: { $in: [PO_STATUSES.DRAFT, PO_STATUSES.SUBMITTED] },
    }),

    // Pending SO Count
    SalesOrder.countDocuments({
      companyId,
      status: { $in: [SALES_ORDER_STATUSES.DRAFT, SALES_ORDER_STATUSES.SUBMITTED] },
    }),

    // Products
    Product.find({ companyId, isActive: true }).populate('category', 'name code'),

    // Balances
    StockBalance.find({ companyId }),

    // Quality Stats
    QualityInspection.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: null,
          totalInspected: { $sum: '$inspectedQuantity' },
          totalAccepted: { $sum: '$acceptedQuantity' },
          totalRejected: { $sum: '$rejectedQuantity' },
        },
      },
    ]),

    // Recent Sales Orders
    SalesOrder.find({ companyId })
      .populate('customer', 'name code')
      .sort({ createdAt: -1 })
      .limit(5),

    // Recent Purchase Orders
    PurchaseOrder.find({ companyId })
      .populate('supplier', 'name code')
      .sort({ createdAt: -1 })
      .limit(5),

    // Active Work Orders
    WorkOrder.find({
      companyId,
      status: { $in: [WORK_ORDER_STATUSES.RELEASED, WORK_ORDER_STATUSES.IN_PROGRESS] },
    })
      .populate('product', 'name sku uom')
      .sort({ createdAt: -1 })
      .limit(5),

    // Overdue Invoices
    Invoice.find({
      companyId,
      dueDate: { $lt: new Date() },
      status: { $in: [INVOICE_STATUSES.POSTED, INVOICE_STATUSES.PARTIALLY_PAID] },
    })
      .populate('customerId', 'name code')
      .sort({ dueDate: 1 })
      .limit(5),
  ]);

  // Map onHand by productId
  const onHandByProduct = {};
  allBalances.forEach((b) => {
    const pId = b.productId.toString();
    onHandByProduct[pId] = (onHandByProduct[pId] || 0) + (b.onHand || 0);
  });

  let rawMaterialValue = 0;
  let finishedGoodsValue = 0;
  let lowStockCount = 0;
  const lowStockItems = [];
  const categoryValuation = {};

  allProducts.forEach((p) => {
    const onHand = onHandByProduct[p._id.toString()] || 0;
    const value = onHand * (p.standardCost || 0);

    if (p.itemType === 'raw_material') {
      rawMaterialValue += value;
    } else if (p.itemType === 'finished_good') {
      finishedGoodsValue += value;
    }

    const catName = p.category?.name || 'Uncategorized';
    categoryValuation[catName] = (categoryValuation[catName] || 0) + value;

    if (onHand <= (p.reorderLevel || 0)) {
      lowStockCount++;
      lowStockItems.push({
        id: p._id,
        sku: p.sku,
        name: p.name,
        uom: p.uom,
        itemType: p.itemType,
        onHand,
        reorderLevel: p.reorderLevel,
      });
    }
  });

  // Calculate Quality Rejection Rate
  const qcStats = qualityAgg[0] || { totalInspected: 0, totalAccepted: 0, totalRejected: 0 };
  const rejectionRate =
    qcStats.totalInspected > 0
      ? Math.round((qcStats.totalRejected / qcStats.totalInspected) * 1000) / 10
      : 0;

  // Work Orders by status
  const woStatusCounts = await WorkOrder.aggregate([
    { $match: { companyId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const workOrdersByStatus = Object.values(WORK_ORDER_STATUSES).map((status) => {
    const found = woStatusCounts.find((s) => s._id === status);
    return { status, count: found ? found.count : 0 };
  });

  // Monthly Sales & Purchases (Past 6 months dynamic)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const past6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    past6Months.push({
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      label: monthNames[d.getMonth()],
    });
  }

  // Get real monthly sales from Invoice
  const monthlySalesAgg = await Invoice.aggregate([
    {
      $match: {
        companyId,
        status: { $ne: INVOICE_STATUSES.VOIDED },
        createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total: { $sum: '$grandTotal' },
      },
    },
  ]);

  // Get real monthly purchases from PurchaseOrder
  const monthlyPurchasesAgg = await PurchaseOrder.aggregate([
    {
      $match: {
        companyId,
        status: { $in: [PO_STATUSES.APPROVED, PO_STATUSES.PARTIALLY_RECEIVED, PO_STATUSES.RECEIVED] },
        createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total: { $sum: '$grandTotal' },
      },
    },
  ]);

  // Get real monthly completed work orders
  const monthlyWOAgg = await WorkOrder.aggregate([
    {
      $match: {
        companyId,
        status: WORK_ORDER_STATUSES.COMPLETED,
        createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  const monthlyData = past6Months.map(({ year, monthIndex, label }) => {
    const sFound = monthlySalesAgg.find((s) => s._id.year === year && s._id.month === monthIndex + 1);
    const pFound = monthlyPurchasesAgg.find((p) => p._id.year === year && p._id.month === monthIndex + 1);
    const wFound = monthlyWOAgg.find((w) => w._id.year === year && w._id.month === monthIndex + 1);
    return {
      month: label,
      sales: sFound ? Math.round(sFound.total * 100) / 100 : 0,
      purchases: pFound ? Math.round(pFound.total * 100) / 100 : 0,
      production: wFound ? wFound.count : 0,
    };
  });

  const inventoryByCategory = Object.entries(categoryValuation).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));

  return ApiResponse.success(res, {
    summary: {
      totalSales: Math.round((salesAgg[0]?.total || 0) * 100) / 100,
      totalPurchases: Math.round((purchasesAgg[0]?.total || 0) * 100) / 100,
      rawMaterialValue: Math.round(rawMaterialValue * 100) / 100,
      finishedGoodsValue: Math.round(finishedGoodsValue * 100) / 100,
      totalInventoryValue: Math.round((rawMaterialValue + finishedGoodsValue) * 100) / 100,
      activeWorkOrders: activeWO,
      pendingPurchaseOrders: pendingPO,
      pendingSalesOrders: pendingSO,
      lowStockCount,
      rejectionRate,
      outstandingReceivables: Math.round((receivablesAgg[0]?.total || 0) * 100) / 100,
    },
    charts: {
      monthlySalesAndPurchases: monthlyData,
      workOrdersByStatus,
      inventoryByCategory,
    },
    tables: {
      recentSalesOrders: recentSales,
      recentPurchaseOrders: recentPurchases,
      activeWorkOrders: activeWorkOrdersList,
      lowStockItems: lowStockItems.slice(0, 5),
      overdueInvoices,
    },
  });
});
