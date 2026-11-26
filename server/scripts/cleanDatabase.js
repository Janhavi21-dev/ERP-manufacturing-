import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../src/config/db.js';
import { ROLES, ROLE_PERMISSIONS } from '../src/config/constants.js';
import { Company } from '../src/modules/company/company.model.js';
import { Role } from '../src/modules/roles/role.model.js';
import { User } from '../src/modules/users/user.model.js';
import { ProductCategory } from '../src/modules/categories/category.model.js';
import { UnitOfMeasure } from '../src/modules/units/unit.model.js';
import { Warehouse } from '../src/modules/warehouses/warehouse.model.js';
import { Supplier } from '../src/modules/suppliers/supplier.model.js';
import { Customer } from '../src/modules/customers/customer.model.js';
import { Product } from '../src/modules/products/product.model.js';
import { StockBalance } from '../src/modules/inventory/stockBalance.model.js';
import { StockMovement } from '../src/modules/inventory/stockMovement.model.js';
import { PurchaseOrder } from '../src/modules/procurement/purchaseOrder.model.js';
import { GoodsReceipt } from '../src/modules/procurement/goodsReceipt.model.js';
import { PurchaseRequisition } from '../src/modules/procurement/purchaseRequisition.model.js';
import { BillOfMaterials } from '../src/modules/bills-of-materials/bom.model.js';
import { WorkOrder } from '../src/modules/production/workOrder.model.js';
import { QualityInspection } from '../src/modules/quality/qualityInspection.model.js';
import { Nonconformance } from '../src/modules/quality/nonconformance.model.js';
import { SalesOrder } from '../src/modules/sales/salesOrder.model.js';
import { Dispatch } from '../src/modules/dispatch/dispatch.model.js';
import { Invoice } from '../src/modules/invoicing/invoice.model.js';
import { Payment } from '../src/modules/payments/payment.model.js';
import { Expense } from '../src/modules/expenses/expense.model.js';
import { Employee } from '../src/modules/employees/employee.model.js';
import { Notification } from '../src/modules/notifications/notification.model.js';
import { AuditLog } from '../src/modules/audit-logs/auditLog.model.js';
import { Counter } from '../src/modules/settings/counter.model.js';

export const cleanAllDummyData = async (disconnectWhenDone = true) => {
  try {
    console.log('🧹 Removing all dummy data from database...');
    await connectDB();

    // 1. Wipe all operational and transactional data
    const transactionalCollections = [
      Product,
      ProductCategory,
      Warehouse,
      Supplier,
      Customer,
      StockBalance,
      StockMovement,
      PurchaseRequisition,
      PurchaseOrder,
      GoodsReceipt,
      BillOfMaterials,
      WorkOrder,
      QualityInspection,
      Nonconformance,
      SalesOrder,
      Dispatch,
      Invoice,
      Payment,
      Expense,
      Employee,
      Notification,
      AuditLog,
      Counter,
      User,
      Company,
      Role,
    ];

    for (const model of transactionalCollections) {
      const res = await model.deleteMany({});
      console.log(`  - Emptied ${model.modelName}: ${res.deletedCount} records removed`);
    }

    // 2. Set up clean base organization and super admin only
    console.log('🏛️ Initializing clean system configuration...');
    const defaultCompanyName = process.env.DEFAULT_COMPANY_NAME || 'Manufacturing ERP';
    const company = await Company.create({
      name: defaultCompanyName,
      code: 'APEX',
      legalName: defaultCompanyName,
      email: 'admin@apex.com',
      currency: 'INR',
      timezone: 'UTC',
      fiscalYearStartMonth: 1,
      isActive: true,
    });

    // 3. Create standard system roles
    const roleDocs = {};
    for (const [roleKey, roleName] of Object.entries(ROLES)) {
      const perms = ROLE_PERMISSIONS[roleName] || [];
      const role = await Role.create({
        company: company._id,
        name: roleName,
        description: `Standard system role for ${roleName}`,
        permissions: perms,
        isSystem: true,
      });
      roleDocs[roleName] = role;
    }

    // 4. Create standard initial Super Admin account (User model pre-save hook will hash it once)
    await User.create({
      companyId: company._id,
      name: 'Arthur Admin',
      email: 'admin@apex.com',
      password: 'Password123!',
      role: roleDocs[ROLES.SUPER_ADMIN]._id,
      roleName: ROLES.SUPER_ADMIN,
      isActive: true,
    });

    // 5. Standard Units of Measure (standard ISO, non-dummy)
    const standardUoms = [
      { name: 'Pieces', code: 'PCS', symbol: 'pcs' },
      { name: 'Kilograms', code: 'KG', symbol: 'kg' },
      { name: 'Meters', code: 'MTR', symbol: 'm' },
      { name: 'Liters', code: 'LTR', symbol: 'L' },
      { name: 'Box', code: 'BOX', symbol: 'box' },
    ];
    for (const uom of standardUoms) {
      await UnitOfMeasure.create({
        companyId: company._id,
        name: uom.name,
        code: uom.code,
        symbol: uom.symbol,
        isActive: true,
      });
    }

    console.log('✅ ALL DUMMY DATA REMOVED SUCCESSFULLY.');
    console.log('📌 Clean database is ready. Only Admin account (admin@apex.com) and base roles exist.');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    if (disconnectWhenDone) {
      await disconnectDB();
    }
  }
};

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('cleanDatabase.js')) {
  cleanAllDummyData(true);
}
