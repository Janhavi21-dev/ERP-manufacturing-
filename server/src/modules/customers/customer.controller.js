import { Customer } from './customer.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getCustomers = asyncHandler(async (req, res) => {
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

  const [customers, total] = await Promise.all([
    Customer.find(query).sort({ name: 1 }).skip(skip).limit(parsedLimit),
    Customer.countDocuments(query),
  ]);

  return ApiResponse.success(res, customers, 'Customers retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!customer) throw ApiError.notFound('Customer not found');
  return ApiResponse.success(res, customer);
});

export const createCustomer = asyncHandler(async (req, res) => {
  const {
    code,
    name,
    contactPerson,
    email,
    phone,
    billingAddress,
    shippingAddress,
    taxNumber,
    creditLimit,
    paymentTerms,
  } = req.body;
  if (!code || !name) throw ApiError.badRequest('Code and Name are required');

  const existing = await Customer.findOne({
    companyId: req.companyId,
    code: code.toUpperCase().trim(),
  });
  if (existing) throw ApiError.conflict(`Customer code '${code}' already exists`);

  const customer = await Customer.create({
    companyId: req.companyId,
    code: code.toUpperCase().trim(),
    name: name.trim(),
    contactPerson,
    email,
    phone,
    billingAddress,
    shippingAddress,
    taxNumber,
    creditLimit: Number(creditLimit) || 0,
    paymentTerms: paymentTerms || 'Due on Receipt',
    balance: 0,
    isActive: true,
  });

  return ApiResponse.created(res, customer, 'Customer created');
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!customer) throw ApiError.notFound('Customer not found');

  const fields = [
    'name',
    'contactPerson',
    'email',
    'phone',
    'billingAddress',
    'shippingAddress',
    'taxNumber',
    'creditLimit',
    'paymentTerms',
    'isActive',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) customer[f] = req.body[f];
  });

  await customer.save();
  return ApiResponse.success(res, customer, 'Customer updated');
});
