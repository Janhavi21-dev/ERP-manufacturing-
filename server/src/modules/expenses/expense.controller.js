import { Expense } from './expense.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getNextSequence } from '../../utils/sequenceGenerator.js';
import { recordAuditLog } from '../audit-logs/auditLog.model.js';

export const getExpenses = asyncHandler(async (req, res) => {
  const { category, startDate, endDate, page = 1, limit = 20 } = req.query;

  const query = { companyId: req.companyId };
  if (category) query.category = category;

  if (startDate || endDate) {
    query.expenseDate = {};
    if (startDate) query.expenseDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.expenseDate.$lte = end;
    }
  }

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [expenses, total] = await Promise.all([
    Expense.find(query)
      .populate('recordedBy', 'name email')
      .sort({ expenseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Expense.countDocuments(query),
  ]);

  return ApiResponse.success(res, expenses, 'Expenses retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const createExpense = asyncHandler(async (req, res) => {
  const {
    category,
    title,
    amount,
    paymentMethod = 'Bank Transfer',
    vendor,
    expenseDate,
    notes,
  } = req.body;

  if (!category || !title || !amount || Number(amount) <= 0) {
    throw ApiError.badRequest('Category, title, and a positive amount are required');
  }

  const expenseNumber = await getNextSequence(req.companyId, 'EXP', 'EXP', 4);

  const expense = await Expense.create({
    companyId: req.companyId,
    expenseNumber,
    category,
    title,
    amount: Math.round(Number(amount) * 100) / 100,
    paymentMethod,
    vendor,
    expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
    recordedBy: req.user._id,
    notes,
  });

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'EXPENSE_RECORDED',
    module: 'EXPENSES',
    recordId: expense._id,
    recordRef: expense.expenseNumber,
    details: { category, amount: expense.amount },
    req,
  });

  return ApiResponse.created(res, expense, 'Expense recorded successfully');
});
