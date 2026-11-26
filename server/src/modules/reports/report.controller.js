import { StockBalance } from '../inventory/stockBalance.model.js';
import { Product } from '../products/product.model.js';
import { WorkOrder } from '../production/workOrder.model.js';
import { PurchaseOrder } from '../procurement/purchaseOrder.model.js';
import { SalesOrder } from '../sales/salesOrder.model.js';
import { Invoice } from '../invoicing/invoice.model.js';
import { Expense } from '../expenses/expense.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { INVOICE_STATUSES, PO_STATUSES, WORK_ORDER_STATUSES } from '../../config/constants.js';

export const getInventoryValuationReport = asyncHandler(async (req, res) => {
  const companyId = req.companyId;

  const [products, balances] = await Promise.all([
    Product.find({ companyId, isActive: true })
      .populate('category', 'name')
      .populate('preferredSupplier', 'name'),
    StockBalance.find({ companyId }).populate('warehouseId', 'name code'),
  ]);

  const balanceMap = {};
  balances.forEach((b) => {
    const pId = b.productId.toString();
    if (!balanceMap[pId]) balanceMap[pId] = [];
    balanceMap[pId].push(b);
  });

  let grandTotalValuation = 0;
  const rows = products.map((p) => {
    const prodBalances = balanceMap[p._id.toString()] || [];
    const totalOnHand = prodBalances.reduce((sum, b) => sum + (b.onHand || 0), 0);
    const valuation = Math.round(totalOnHand * (p.standardCost || 0) * 100) / 100;
    grandTotalValuation += valuation;

    return {
      sku: p.sku,
      name: p.name,
      category: p.category?.name || 'Uncategorized',
      itemType: p.itemType,
      uom: p.uom,
      unitCost: p.standardCost || 0,
      onHand: totalOnHand,
      valuation,
    };
  });

  return ApiResponse.success(res, {
    items: rows,
    grandTotalValuation: Math.round(grandTotalValuation * 100) / 100,
  });
});

export const getProductionReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const query = { companyId: req.companyId };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const workOrders = await WorkOrder.find(query)
    .populate('product', 'sku name uom standardCost')
    .populate('assignedTo', 'name email');

  let totalPlannedQuantity = 0;
  let totalAcceptedQuantity = 0;
  let totalRejectedQuantity = 0;
  let totalScrapQuantity = 0;

  const summaryRows = workOrders.map((wo) => {
    totalPlannedQuantity += wo.plannedQuantity || 0;
    totalAcceptedQuantity += wo.actualOutput?.acceptedQuantity || 0;
    totalRejectedQuantity += wo.actualOutput?.rejectedQuantity || 0;
    totalScrapQuantity += wo.actualOutput?.scrapQuantity || 0;

    const produced = (wo.actualOutput?.acceptedQuantity || 0) + (wo.actualOutput?.rejectedQuantity || 0);
    const rejectionRate =
      produced > 0
        ? Math.round(((wo.actualOutput?.rejectedQuantity || 0) / produced) * 1000) / 10
        : 0;

    return {
      workOrderNumber: wo.workOrderNumber,
      product: wo.product?.name,
      sku: wo.product?.sku,
      plannedQuantity: wo.plannedQuantity,
      acceptedQuantity: wo.actualOutput?.acceptedQuantity || 0,
      rejectedQuantity: wo.actualOutput?.rejectedQuantity || 0,
      scrapQuantity: wo.actualOutput?.scrapQuantity || 0,
      rejectionRate,
      status: wo.status,
      assignedTo: wo.assignedTo?.name || 'Unassigned',
      targetDate: wo.targetDate,
      completionDate: wo.actualCompletionDate,
    };
  });

  const totalProduced = totalAcceptedQuantity + totalRejectedQuantity;
  const overallRejectionRate =
    totalProduced > 0 ? Math.round((totalRejectedQuantity / totalProduced) * 1000) / 10 : 0;

  return ApiResponse.success(res, {
    summary: {
      totalWorkOrders: workOrders.length,
      totalPlannedQuantity,
      totalAcceptedQuantity,
      totalRejectedQuantity,
      totalScrapQuantity,
      overallRejectionRate,
    },
    orders: summaryRows,
  });
});

export const getInvoiceAgingReport = asyncHandler(async (req, res) => {
  const companyId = req.companyId;

  const invoices = await Invoice.find({
    companyId,
    status: { $in: [INVOICE_STATUSES.POSTED, INVOICE_STATUSES.PARTIALLY_PAID] },
  }).populate('customerId', 'name code');

  const now = new Date();
  const aging = {
    current: 0, // 0-30 days
    days31to60: 0,
    days61to90: 0,
    over90: 0,
    totalOutstanding: 0,
    records: [],
  };

  invoices.forEach((inv) => {
    const diffTime = now.getTime() - new Date(inv.dueDate).getTime();
    const daysPastDue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const balance = inv.balanceDue || 0;

    aging.totalOutstanding += balance;

    let bucket = 'Current (0-30 days)';
    if (daysPastDue <= 30) {
      aging.current += balance;
    } else if (daysPastDue <= 60) {
      aging.days31to60 += balance;
      bucket = '31-60 days';
    } else if (daysPastDue <= 90) {
      aging.days61to90 += balance;
      bucket = '61-90 days';
    } else {
      aging.over90 += balance;
      bucket = 'Over 90 days';
    }

    aging.records.push({
      invoiceNumber: inv.invoiceNumber,
      customer: inv.customerSnapshot?.name || inv.customerId?.name,
      grandTotal: inv.grandTotal,
      amountPaid: inv.amountPaid,
      balanceDue: inv.balanceDue,
      dueDate: inv.dueDate,
      daysPastDue,
      bucket,
    });
  });

  // Round summary figures
  aging.current = Math.round(aging.current * 100) / 100;
  aging.days31to60 = Math.round(aging.days31to60 * 100) / 100;
  aging.days61to90 = Math.round(aging.days61to90 * 100) / 100;
  aging.over90 = Math.round(aging.over90 * 100) / 100;
  aging.totalOutstanding = Math.round(aging.totalOutstanding * 100) / 100;

  return ApiResponse.success(res, aging);
});

export const getFinancialSummaryReport = asyncHandler(async (req, res) => {
  const companyId = req.companyId;

  const [invoices, expenses, workOrders] = await Promise.all([
    Invoice.find({ companyId, status: { $ne: INVOICE_STATUSES.VOIDED } }),
    Expense.find({ companyId }),
    WorkOrder.find({ companyId, status: WORK_ORDER_STATUSES.COMPLETED }).populate('product'),
  ]);

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalReceived = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Estimate Cost of Goods Produced/Sold
  const estimatedCOGS = workOrders.reduce((sum, wo) => {
    const qty = wo.actualOutput?.acceptedQuantity || 0;
    const cost = wo.product?.standardCost || 0;
    return sum + qty * cost;
  }, 0);

  const estimatedGrossProfit = totalRevenue - estimatedCOGS;
  const estimatedNetOperatingProfit = estimatedGrossProfit - totalExpenses;

  return ApiResponse.success(res, {
    disclaimer:
      'Management-level financial estimates derived from sales invoices, estimated production COGS, and operational expenses.',
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCashReceived: Math.round(totalReceived * 100) / 100,
    totalReceivables: Math.round(totalOutstanding * 100) / 100,
    estimatedCOGS: Math.round(estimatedCOGS * 100) / 100,
    estimatedGrossProfit: Math.round(estimatedGrossProfit * 100) / 100,
    totalOperatingExpenses: Math.round(totalExpenses * 100) / 100,
    estimatedNetOperatingProfit: Math.round(estimatedNetOperatingProfit * 100) / 100,
  });
});
