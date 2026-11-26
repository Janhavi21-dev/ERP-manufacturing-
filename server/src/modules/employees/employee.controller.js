import { Employee } from './employee.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getNextSequence } from '../../utils/sequenceGenerator.js';

export const getEmployees = asyncHandler(async (req, res) => {
  const { department, isActive, search, page = 1, limit = 20 } = req.query;

  const query = { companyId: req.companyId };
  if (department) query.department = department;
  if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { employeeCode: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const parsedLimit = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * parsedLimit;

  const [employees, total] = await Promise.all([
    Employee.find(query).sort({ firstName: 1 }).skip(skip).limit(parsedLimit),
    Employee.countDocuments(query),
  ]);

  return ApiResponse.success(res, employees, 'Employees retrieved', 200, {
    page: parseInt(page, 10),
    limit: parsedLimit,
    total,
    totalPages: Math.ceil(total / parsedLimit),
  });
});

export const createEmployee = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    department,
    designation,
    joiningDate,
    team,
  } = req.body;

  if (!firstName || !lastName || !department || !designation) {
    throw ApiError.badRequest('First name, last name, department, and designation are required');
  }

  const employeeCode = await getNextSequence(req.companyId, 'EMP', 'EMP', 3);

  const employee = await Employee.create({
    companyId: req.companyId,
    employeeCode,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email ? email.toLowerCase().trim() : null,
    phone,
    department: department.trim(),
    designation: designation.trim(),
    joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
    team,
    isActive: true,
  });

  return ApiResponse.created(res, employee, 'Employee created successfully');
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!employee) throw ApiError.notFound('Employee not found');

  const fields = ['firstName', 'lastName', 'email', 'phone', 'department', 'designation', 'team', 'isActive'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) employee[f] = req.body[f];
  });

  await employee.save();
  return ApiResponse.success(res, employee, 'Employee updated successfully');
});
