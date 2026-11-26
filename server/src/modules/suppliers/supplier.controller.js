import { Supplier } from './supplier.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getSuppliers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', isActive } = req.query;

  const query = { companyId: req.companyId };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [suppliers, total] = await Promise.all([
    Supplier.find(query).sort({ name: 1 }).skip(skip).limit(parsedLimit),
    Supplier.countDocuments(query),
  ]);

  return ApiResponse.success(res, suppliers, 'Suppliers retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!supplier) throw ApiError.notFound('Supplier not found');
  return ApiResponse.success(res, supplier);
});

export const createSupplier = asyncHandler(async (req, res) => {
  const { code, name, contactPerson, email, phone, address, taxNumber, paymentTerms } = req.body;
  if (!code || !name) throw ApiError.badRequest('Code and Name are required');

  const existing = await Supplier.findOne({
    companyId: req.companyId,
    code: code.toUpperCase().trim(),
  });
  if (existing) throw ApiError.conflict(`Supplier code '${code}' already exists`);

  const supplier = await Supplier.create({
    companyId: req.companyId,
    code: code.toUpperCase().trim(),
    name: name.trim(),
    contactPerson,
    email,
    phone,
    address,
    taxNumber,
    paymentTerms: paymentTerms || 'Net 30',
    balance: 0,
    isActive: true,
  });

  return ApiResponse.created(res, supplier, 'Supplier created');
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const fields = ['name', 'contactPerson', 'email', 'phone', 'address', 'taxNumber', 'paymentTerms', 'isActive'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) supplier[f] = req.body[f];
  });

  await supplier.save();
  return ApiResponse.success(res, supplier, 'Supplier updated');
});
