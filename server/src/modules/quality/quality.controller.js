import { QualityInspection } from './qualityInspection.model.js';
import { Nonconformance } from './nonconformance.model.js';
import { Product } from '../products/product.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getNextSequence } from '../../utils/sequenceGenerator.js';
import { recordAuditLog } from '../audit-logs/auditLog.model.js';
import { createNotification } from '../notifications/notification.model.js';
import { QUALITY_STATUSES } from '../../config/constants.js';

export const getInspections = asyncHandler(async (req, res) => {
  const { inspectionType, status, productId, page = 1, limit = 20 } = req.query;

  const query = { companyId: req.companyId };
  if (inspectionType) query.inspectionType = inspectionType;
  if (status) query.status = status;
  if (productId) query.product = productId;

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [inspections, total] = await Promise.all([
    QualityInspection.find(query)
      .populate('product', 'sku name uom itemType')
      .populate('inspector', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    QualityInspection.countDocuments(query),
  ]);

  return ApiResponse.success(res, inspections, 'Quality inspections retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const getInspectionById = asyncHandler(async (req, res) => {
  const inspection = await QualityInspection.findOne({
    _id: req.params.id,
    companyId: req.companyId,
  })
    .populate('product')
    .populate('inspector', 'name email');

  if (!inspection) throw ApiError.notFound('Quality inspection not found');
  return ApiResponse.success(res, inspection);
});

export const createInspection = asyncHandler(async (req, res) => {
  const {
    inspectionType,
    referenceType,
    referenceId,
    referenceNumber,
    productId,
    batchNumber,
    sampleSize,
    inspectedQuantity,
    acceptedQuantity,
    rejectedQuantity,
    parameters = [],
    defects = [],
    disposition = 'pending',
    notes,
  } = req.body;

  if (!inspectionType || !referenceType || !productId || !sampleSize || inspectedQuantity === undefined) {
    throw ApiError.badRequest('Inspection type, reference, product, sample size, and inspected quantity are required');
  }

  const product = await Product.findOne({ _id: productId, companyId: req.companyId });
  if (!product) throw ApiError.notFound('Product not found');

  const parsedAccepted = Number(acceptedQuantity ?? inspectedQuantity);
  const parsedRejected = Number(rejectedQuantity ?? (inspectedQuantity - parsedAccepted));

  // Determine overall pass/fail status
  const hasFailedParams = parameters.some((p) => p.isPassed === false);
  const hasCriticalDefects = defects.some((d) => d.severity === 'critical');
  let status = QUALITY_STATUSES.PASSED;

  if (hasCriticalDefects || parsedRejected > 0 || hasFailedParams) {
    status = parsedAccepted > 0 ? QUALITY_STATUSES.CONDITIONALLY_ACCEPTED : QUALITY_STATUSES.FAILED;
  }

  const inspectionNumber = await getNextSequence(req.companyId, 'QC', 'QC', 4);

  const inspection = await QualityInspection.create({
    companyId: req.companyId,
    inspectionNumber,
    inspectionType,
    referenceType,
    referenceId,
    referenceNumber,
    product: product._id,
    batchNumber,
    sampleSize: Number(sampleSize),
    inspectedQuantity: Number(inspectedQuantity),
    acceptedQuantity: parsedAccepted,
    rejectedQuantity: parsedRejected,
    parameters,
    defects,
    status,
    disposition,
    inspector: req.user._id,
    notes,
  });

  // If inspection failed or has defects, auto-generate Nonconformance Report (NCR)
  let ncr = null;
  if (status === QUALITY_STATUSES.FAILED || defects.length > 0) {
    const ncrNumber = await getNextSequence(req.companyId, 'NCR', 'NCR', 4);
    const primaryDefect = defects[0]?.description || `Failed inspection during ${inspectionType} quality check`;

    ncr = await Nonconformance.create({
      companyId: req.companyId,
      ncrNumber,
      inspectionId: inspection._id,
      product: product._id,
      batchNumber,
      severity: hasCriticalDefects ? 'critical' : 'major',
      defectDescription: primaryDefect,
      status: 'open',
      disposition: disposition === 'pending' ? 'rework' : disposition,
      reportedBy: req.user._id,
    });

    await createNotification({
      companyId: req.companyId,
      title: 'Quality Nonconformance (NCR) Logged',
      message: `NCR ${ncrNumber} created for product ${product.name} (Batch: ${batchNumber || 'N/A'})`,
      type: 'warning',
      category: 'QUALITY',
      link: `/quality/nonconformances`,
    });
  }

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'QUALITY_INSPECTION_RECORDED',
    module: 'QUALITY',
    recordId: inspection._id,
    recordRef: inspection.inspectionNumber,
    details: { status, acceptedQuantity: parsedAccepted, rejectedQuantity: parsedRejected },
    req,
  });

  const created = await QualityInspection.findById(inspection._id)
    .populate('product', 'sku name uom')
    .populate('inspector', 'name email');

  return ApiResponse.created(res, { inspection: created, nonconformance: ncr }, 'Quality inspection recorded');
});

// =================== NONCONFORMANCE (NCR) ===================

export const getNonconformances = asyncHandler(async (req, res) => {
  const { status, severity, productId, page = 1, limit = 20 } = req.query;

  const query = { companyId: req.companyId };
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (productId) query.product = productId;

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [records, total] = await Promise.all([
    Nonconformance.find(query)
      .populate('product', 'sku name uom')
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('inspectionId', 'inspectionNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Nonconformance.countDocuments(query),
  ]);

  return ApiResponse.success(res, records, 'Nonconformance records retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const updateNonconformance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ncr = await Nonconformance.findOne({ _id: id, companyId: req.companyId });
  if (!ncr) throw ApiError.notFound('Nonconformance record not found');

  const {
    rootCause,
    correctiveAction,
    preventiveAction,
    status,
    disposition,
    assignedTo,
  } = req.body;

  if (rootCause !== undefined) ncr.rootCause = rootCause;
  if (correctiveAction !== undefined) ncr.correctiveAction = correctiveAction;
  if (preventiveAction !== undefined) ncr.preventiveAction = preventiveAction;
  if (disposition !== undefined) ncr.disposition = disposition;
  if (assignedTo !== undefined) ncr.assignedTo = assignedTo;

  if (status) {
    ncr.status = status;
    if (status === 'resolved' || status === 'closed') {
      ncr.resolutionDate = new Date();
    }
  }

  await ncr.save();

  await recordAuditLog({
    companyId: req.companyId,
    user: req.user,
    action: 'NONCONFORMANCE_UPDATED',
    module: 'QUALITY',
    recordId: ncr._id,
    recordRef: ncr.ncrNumber,
    details: { status: ncr.status },
    req,
  });

  const updated = await Nonconformance.findById(ncr._id)
    .populate('product', 'sku name uom')
    .populate('reportedBy', 'name email')
    .populate('assignedTo', 'name email');

  return ApiResponse.success(res, updated, 'Nonconformance record updated');
});
