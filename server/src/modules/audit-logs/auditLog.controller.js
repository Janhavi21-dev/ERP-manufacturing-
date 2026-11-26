import { AuditLog } from './auditLog.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    module,
    action,
    status,
    startDate,
    endDate,
    search,
  } = req.query;

  const query = { companyId: req.companyId };

  if (module) query.module = module;
  if (action) query.action = action;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  if (search) {
    query.$or = [
      { userName: { $regex: search, $options: 'i' } },
      { recordRef: { $regex: search, $options: 'i' } },
      { action: { $regex: search, $options: 'i' } },
    ];
  }

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
    AuditLog.countDocuments(query),
  ]);

  return ApiResponse.success(res, logs, 'Audit logs retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});
