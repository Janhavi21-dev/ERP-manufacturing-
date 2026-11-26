import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../src/config/db.js';
import { ROLES, ROLE_PERMISSIONS, ITEM_TYPES, STOCK_MOVEMENT_TYPES, PO_STATUSES, WORK_ORDER_STATUSES, QUALITY_STATUSES, SALES_ORDER_STATUSES, INVOICE_STATUSES } from '../src/config/constants.js';
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

export const seedDatabase = async (disconnectWhenDone = true) => {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    await connectDB();

    // 1. Clear existing collections
    console.log('🧹 Cleaning existing data...');
    const collections = [
      Company, Role, User, ProductCategory, UnitOfMeasure, Warehouse,
      Supplier, Customer, Product, StockBalance, StockMovement,
      PurchaseOrder, GoodsReceipt, BillOfMaterials, WorkOrder,
      QualityInspection, Nonconformance, SalesOrder, Dispatch,
      Invoice, Payment, Expense, Employee, Notification, AuditLog, Counter,
    ];
    for (const model of collections) {
      await model.deleteMany({});
    }

    // 2. Create Sample Company
    console.log('🏢 Creating sample company...');
    const defaultCompanyName = process.env.DEFAULT_COMPANY_NAME || 'Manufacturing ERP';
    const company = await Company.create({
      name: defaultCompanyName,
      code: 'APEX',
      email: 'info@apexmanufacturing.io',
      phone: '+1 (555) 234-5678',
      address: {
        street: '450 Industrial Parkway, Suite 100',
        city: 'Detroit',
        state: 'MI',
        postalCode: '48201',
        country: 'United States',
      },
      taxNumber: 'US-EIN-987654321',
      currency: 'USD',
      timezone: 'America/New_York',
      settings: {
        allowNegativeStock: false,
        quarantineRejectedStock: true,
      },
    });

    // 3. Create Standard Roles
    console.log('🛡️ Creating system roles & permissions...');
    const roleDocs = {};
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await Role.create({
        companyId: company._id,
        name: roleName,
        description: `Standard system role for ${roleName}`,
        permissions,
        isSystemRole: true,
      });
      roleDocs[roleName] = role;
    }

    // 4. Create Demo Users for Each Role
    console.log('👥 Creating demo users for all 8 roles...');
    const defaultPassword = 'Password123!';
    const userCredentials = [
      { name: 'Arthur Admin', email: 'admin@apex.com', role: ROLES.SUPER_ADMIN },
      { name: 'Peter Production', email: 'production@apex.com', role: ROLES.PRODUCTION_MANAGER },
      { name: 'Ian Inventory', email: 'inventory@apex.com', role: ROLES.INVENTORY_MANAGER },
      { name: 'Pam Procurement', email: 'procurement@apex.com', role: ROLES.PROCUREMENT_OFFICER },
      { name: 'Sam Sales', email: 'sales@apex.com', role: ROLES.SALES_MANAGER },
      { name: 'Quinn Quality', email: 'quality@apex.com', role: ROLES.QUALITY_INSPECTOR },
      { name: 'Alice Accountant', email: 'accountant@apex.com', role: ROLES.ACCOUNTANT },
      { name: 'Edward Operator', email: 'operator@apex.com', role: ROLES.OPERATOR },
    ];

    const users = {};
    for (const cred of userCredentials) {
      const user = await User.create({
        companyId: company._id,
        name: cred.name,
        email: cred.email,
        password: defaultPassword,
        role: roleDocs[cred.role]._id,
        roleName: cred.role,
        isActive: true,
      });
      users[cred.role] = user;
    }

    // 5. Create Employees
    console.log('👷 Creating employees...');
    const emp1 = await Employee.create({
      companyId: company._id,
      employeeCode: 'EMP-001',
      firstName: 'Arthur',
      lastName: 'Pendelton',
      email: 'admin@apex.com',
      department: 'Management',
      designation: 'General Operations Director',
      joiningDate: new Date('2023-01-15'),
    });
    const emp2 = await Employee.create({
      companyId: company._id,
      employeeCode: 'EMP-002',
      firstName: 'Peter',
      lastName: 'Vance',
      email: 'production@apex.com',
      department: 'Production',
      designation: 'Head of Manufacturing',
      joiningDate: new Date('2023-03-01'),
      team: 'Assembly Team Alpha',
    });

    // 6. Create Units of Measure
    console.log('📏 Creating units of measure...');
    const uomPcs = await UnitOfMeasure.create({ companyId: company._id, code: 'PCS', name: 'Pieces', symbol: 'pcs' });
    const uomKg = await UnitOfMeasure.create({ companyId: company._id, code: 'KG', name: 'Kilograms', symbol: 'kg' });
    const uomM = await UnitOfMeasure.create({ companyId: company._id, code: 'M', name: 'Meters', symbol: 'm' });
    const uomL = await UnitOfMeasure.create({ companyId: company._id, code: 'L', name: 'Litres', symbol: 'L' });

    // 7. Create Warehouses
    console.log('🏬 Creating warehouses...');
    const whMain = await Warehouse.create({
      companyId: company._id,
      code: 'WH-MAIN',
      name: 'Central Distribution & Raw Materials Warehouse',
      address: { street: '450 Industrial Parkway', city: 'Detroit', state: 'MI', postalCode: '48201', country: 'United States' },
      contactPerson: 'Ian Inventory',
      isDefault: true,
    });
    const whPlant = await Warehouse.create({
      companyId: company._id,
      code: 'WH-PLANT',
      name: 'Plant 1 Manufacturing & Assembly Floor',
      address: { street: '452 Industrial Parkway', city: 'Detroit', state: 'MI', postalCode: '48201', country: 'United States' },
      contactPerson: 'Peter Vance',
      isDefault: false,
    });

    // 8. Create Product Categories
    console.log('🏷️ Creating product categories...');
    const catMetal = await ProductCategory.create({ companyId: company._id, code: 'RAW-MTL', name: 'Raw Metals & Alloys', description: 'Sheet metal, bars, extrusion profiles' });
    const catHardware = await ProductCategory.create({ companyId: company._id, code: 'HDW', name: 'Fasteners & Hardware', description: 'Bolts, screws, washers, bearings' });
    const catElectronics = await ProductCategory.create({ companyId: company._id, code: 'ELEC', name: 'Electronics & Motors', description: 'Servos, wiring harnesses, controller boards' });
    const catFinished = await ProductCategory.create({ companyId: company._id, code: 'FG-ROBOT', name: 'Industrial Robotics', description: 'Finished robotic arm units and actuators' });

    // 9. Create Suppliers & Customers
    console.log('🤝 Creating suppliers and customers...');
    const suppMetals = await Supplier.create({
      companyId: company._id,
      code: 'SUP-001',
      name: 'Midwest Steel & Alloys Corp.',
      contactPerson: 'David Miller',
      email: 'sales@midweststeel.com',
      phone: '+1 (312) 555-0199',
      address: { street: '800 Lake Shore Dr', city: 'Chicago', state: 'IL', postalCode: '60611', country: 'USA' },
      taxNumber: 'US-TAX-112233',
      paymentTerms: 'Net 30',
      balance: 14500,
    });
    const suppHardware = await Supplier.create({
      companyId: company._id,
      code: 'SUP-002',
      name: 'Precision Fasteners & Bearings Ltd',
      contactPerson: 'Karen White',
      email: 'orders@precisionfasteners.com',
      phone: '+1 (414) 555-0144',
      paymentTerms: 'Net 15',
      balance: 3200,
    });

    const custAutomation = await Customer.create({
      companyId: company._id,
      code: 'CUST-001',
      name: 'Nexus Automation Systems LLC',
      contactPerson: 'Marcus Brody',
      email: 'procurement@nexusauto.io',
      phone: '+1 (614) 555-8822',
      billingAddress: { street: '120 Innovation Way', city: 'Columbus', state: 'OH', postalCode: '43215', country: 'USA' },
      creditLimit: 100000,
      paymentTerms: 'Net 30',
      balance: 24500,
    });
    const custAero = await Customer.create({
      companyId: company._id,
      code: 'CUST-002',
      name: 'AeroDynamics Assembly Works',
      contactPerson: 'Sarah Jenkins',
      email: 's.jenkins@aerodynamics.com',
      phone: '+1 (206) 555-7391',
      creditLimit: 150000,
      paymentTerms: 'Net 45',
      balance: 42000,
    });

    // 10. Create Products (Raw Materials & Finished Goods)
    console.log('📦 Creating master products...');
    // Raw materials
    const rawAluminum = await Product.create({
      companyId: company._id,
      sku: 'RM-ALU-6061',
      name: 'Aluminum 6061-T6 Extrusion Bar (2m)',
      category: catMetal._id,
      itemType: ITEM_TYPES.RAW_MATERIAL,
      uom: 'pcs',
      standardCost: 45.0,
      reorderLevel: 20,
      reorderQuantity: 100,
      preferredSupplier: suppMetals._id,
      taxRate: 5,
    });
    const rawSteelPlate = await Product.create({
      companyId: company._id,
      sku: 'RM-STL-304',
      name: 'Stainless Steel 304 Base Plate (10mm)',
      category: catMetal._id,
      itemType: ITEM_TYPES.RAW_MATERIAL,
      uom: 'pcs',
      standardCost: 78.0,
      reorderLevel: 15,
      reorderQuantity: 60,
      preferredSupplier: suppMetals._id,
      taxRate: 5,
    });
    const rawMotor = await Product.create({
      companyId: company._id,
      sku: 'RM-MTR-NEMA23',
      name: 'High-Torque NEMA 23 Stepper Motor',
      category: catElectronics._id,
      itemType: ITEM_TYPES.RAW_MATERIAL,
      uom: 'pcs',
      standardCost: 65.0,
      reorderLevel: 25,
      reorderQuantity: 80,
      taxRate: 8,
    });
    const rawBearings = await Product.create({
      companyId: company._id,
      sku: 'RM-BRG-608ZZ',
      name: 'Precision Shielded Ball Bearing 608ZZ',
      category: catHardware._id,
      itemType: ITEM_TYPES.RAW_MATERIAL,
      uom: 'pcs',
      standardCost: 4.5,
      reorderLevel: 50,
      reorderQuantity: 200,
      preferredSupplier: suppHardware._id,
      taxRate: 5,
    });

    // Finished Goods
    const fgRoboticArm = await Product.create({
      companyId: company._id,
      sku: 'FG-ROBO-ARM-3X',
      name: 'Industrial 3-Axis Articulated Robotic Arm',
      description: 'Precision 3-axis robotic arm with integrated stepper drivers and aluminum casing.',
      category: catFinished._id,
      itemType: ITEM_TYPES.FINISHED_GOOD,
      uom: 'pcs',
      standardCost: 380.0,
      sellingPrice: 1250.0,
      reorderLevel: 5,
      reorderQuantity: 15,
      taxRate: 10,
    });

    // 11. Create Stock Balances & Initial Stock Movements
    console.log('📊 Initializing warehouse stock balances & movement ledger...');
    const initialStocks = [
      { product: rawAluminum, qty: 150, wh: whMain, cost: 45.0 },
      { product: rawSteelPlate, qty: 80, wh: whMain, cost: 78.0 },
      { product: rawMotor, qty: 120, wh: whMain, cost: 65.0 },
      { product: rawBearings, qty: 400, wh: whMain, cost: 4.5 },
      { product: fgRoboticArm, qty: 12, wh: whMain, cost: 380.0 },
    ];

    let movCounter = 1;
    for (const item of initialStocks) {
      await StockBalance.create({
        companyId: company._id,
        productId: item.product._id,
        warehouseId: item.wh._id,
        onHand: item.qty,
        reserved: 0,
        quarantined: 0,
        allocated: 0,
      });

      await StockMovement.create({
        companyId: company._id,
        movementNumber: `MOV-2026-${String(movCounter++).padStart(4, '0')}`,
        productId: item.product._id,
        warehouseId: item.wh._id,
        type: STOCK_MOVEMENT_TYPES.OPENING_BALANCE,
        quantity: item.qty,
        balanceAfter: item.qty,
        unitCost: item.cost,
        totalCost: item.qty * item.cost,
        referenceType: 'INITIAL_STOCK',
        referenceNumber: 'SETUP-2026',
        userId: users[ROLES.SUPER_ADMIN]._id,
        userName: users[ROLES.SUPER_ADMIN].name,
        notes: 'Initial warehouse opening stock setup',
        timestamp: new Date('2026-01-10'),
      });
    }

    // 12. Create Bill of Materials (BOM)
    console.log('📐 Creating Bill of Materials (BOM)...');
    const bomComponents = [
      { product: rawAluminum._id, quantity: 2, scrapPercentage: 5, unitCost: 45.0 },
      { product: rawSteelPlate._id, quantity: 1, scrapPercentage: 2, unitCost: 78.0 },
      { product: rawMotor._id, quantity: 3, scrapPercentage: 0, unitCost: 65.0 },
      { product: rawBearings._id, quantity: 6, scrapPercentage: 5, unitCost: 4.5 },
    ];
    const materialCost = 2 * 1.05 * 45 + 1 * 1.02 * 78 + 3 * 65 + 6 * 1.05 * 4.5; // ~397.4

    const bom = await BillOfMaterials.create({
      companyId: company._id,
      bomNumber: 'BOM-2026-0001',
      version: '1.0',
      product: fgRoboticArm._id,
      outputQuantity: 1,
      outputUnit: 'pcs',
      components: bomComponents,
      estimatedMaterialCost: Math.round(materialCost * 100) / 100,
      laborCost: 80.0,
      overheadCost: 35.0,
      totalEstimatedCost: Math.round((materialCost + 115) * 100) / 100,
      isApproved: true,
      isActive: true,
      notes: 'Standard production BOM for Robotic Arm Rev 1.0',
    });

    // 13. Create Work Orders
    console.log('⚙️ Creating production work orders...');
    const wo1 = await WorkOrder.create({
      companyId: company._id,
      workOrderNumber: 'WO-2026-0001',
      product: fgRoboticArm._id,
      bom: bom._id,
      bomVersion: '1.0',
      plannedQuantity: 10,
      destinationWarehouse: whMain._id,
      sourceWarehouse: whMain._id,
      plannedMaterials: [
        { product: rawAluminum._id, requiredQuantity: 21, issuedQuantity: 21, unitCost: 45.0 },
        { product: rawSteelPlate._id, requiredQuantity: 10.2, issuedQuantity: 10.2, unitCost: 78.0 },
        { product: rawMotor._id, requiredQuantity: 30, issuedQuantity: 30, unitCost: 65.0 },
        { product: rawBearings._id, requiredQuantity: 63, issuedQuantity: 63, unitCost: 4.5 },
      ],
      priority: 'high',
      startDate: new Date('2026-02-01'),
      targetDate: new Date('2026-02-15'),
      actualStartDate: new Date('2026-02-02'),
      status: WORK_ORDER_STATUSES.IN_PROGRESS,
      actualOutput: { acceptedQuantity: 6, rejectedQuantity: 0, scrapQuantity: 1 },
      createdBy: users[ROLES.PRODUCTION_MANAGER]._id,
      assignedTo: users[ROLES.OPERATOR]._id,
      notes: 'Batch for Nexus Automation order fulfillment',
    });

    // 14. Create Quality Inspection
    console.log('🔬 Creating quality inspection & NCR...');
    const qc1 = await QualityInspection.create({
      companyId: company._id,
      inspectionNumber: 'QC-2026-0001',
      inspectionType: 'incoming',
      referenceType: 'INVENTORY',
      referenceNumber: 'LOT-2026-A1',
      product: rawMotor._id,
      sampleSize: 10,
      inspectedQuantity: 10,
      acceptedQuantity: 9,
      rejectedQuantity: 1,
      parameters: [
        { parameterName: 'Voltage Rating Check', specification: '24V DC +/- 5%', actualValue: '24.1V', isPassed: true },
        { parameterName: 'Torque Resistance', specification: 'Min 1.2 Nm', actualValue: '0.9 Nm', isPassed: false, notes: 'Unit #4 failed torque test' },
      ],
      defects: [
        { defectType: 'Electrical / Torque Defect', severity: 'minor', count: 1, description: 'Motor shaft slippage under peak load' },
      ],
      status: QUALITY_STATUSES.CONDITIONALLY_ACCEPTED,
      disposition: 'rework',
      inspector: users[ROLES.QUALITY_INSPECTOR]._id,
      notes: 'Single unit failed torque rating. Supplier contacted for warranty replacement.',
    });

    // 15. Create Purchase Order & Goods Receipt
    console.log('🛒 Creating sample Purchase Order & Goods Receipt...');
    const po1 = await PurchaseOrder.create({
      companyId: company._id,
      poNumber: 'PO-2026-0001',
      supplier: suppMetals._id,
      items: [
        {
          product: rawAluminum._id,
          quantity: 100,
          receivedQuantity: 100,
          unitPrice: 45.0,
          taxRate: 5,
          taxAmount: 225.0,
          subtotal: 4500.0,
          total: 4725.0,
        },
      ],
      subtotal: 4500.0,
      taxTotal: 225.0,
      grandTotal: 4725.0,
      status: PO_STATUSES.RECEIVED,
      approvedBy: users[ROLES.PROCUREMENT_OFFICER]._id,
      createdBy: users[ROLES.PROCUREMENT_OFFICER]._id,
      expectedDeliveryDate: new Date('2026-01-25'),
    });

    await GoodsReceipt.create({
      companyId: company._id,
      grnNumber: 'GRN-2026-0001',
      purchaseOrderId: po1._id,
      supplierId: suppMetals._id,
      warehouseId: whMain._id,
      deliveryNoteNumber: 'DN-99412',
      items: [
        {
          product: rawAluminum._id,
          orderedQuantity: 100,
          receivedQuantity: 100,
          acceptedQuantity: 100,
          rejectedQuantity: 0,
          unitCost: 45.0,
        },
      ],
      inspectionStatus: 'passed',
      receivedBy: users[ROLES.INVENTORY_MANAGER]._id,
    });

    // 16. Create Sales Order, Dispatch & Invoices
    console.log('💰 Creating Sales Order, Dispatch, Invoice & Payments...');
    const so1 = await SalesOrder.create({
      companyId: company._id,
      soNumber: 'SO-2026-0001',
      customer: custAutomation._id,
      items: [
        {
          product: fgRoboticArm._id,
          quantity: 4,
          dispatchedQuantity: 4,
          unitPrice: 1250.0,
          discountPercentage: 0,
          taxRate: 10,
          taxAmount: 500.0,
          subtotal: 5000.0,
          total: 5500.0,
        },
      ],
      subtotal: 5000.0,
      taxTotal: 500.0,
      grandTotal: 5500.0,
      deliveryDate: new Date('2026-02-28'),
      status: SALES_ORDER_STATUSES.FULFILLED,
      approvedBy: users[ROLES.SALES_MANAGER]._id,
      createdBy: users[ROLES.SALES_MANAGER]._id,
    });

    await Dispatch.create({
      companyId: company._id,
      dispatchNumber: 'DSP-2026-0001',
      salesOrderId: so1._id,
      customerId: custAutomation._id,
      warehouseId: whMain._id,
      carrier: 'FedEx Freight',
      trackingNumber: 'FX-884920412US',
      items: [
        { product: fgRoboticArm._id, orderedQuantity: 4, dispatchQuantity: 4, unitPrice: 1250.0 },
      ],
      status: 'dispatched',
      dispatchedBy: users[ROLES.INVENTORY_MANAGER]._id,
    });

    const inv1 = await Invoice.create({
      companyId: company._id,
      invoiceNumber: 'INV-2026-0001',
      salesOrderId: so1._id,
      customerId: custAutomation._id,
      customerSnapshot: {
        name: custAutomation.name,
        code: custAutomation.code,
        email: custAutomation.email,
        phone: custAutomation.phone,
        billingAddress: custAutomation.billingAddress,
        taxNumber: custAutomation.taxNumber,
      },
      dueDate: new Date('2026-03-30'),
      items: [
        {
          product: fgRoboticArm._id,
          sku: fgRoboticArm.sku,
          name: fgRoboticArm.name,
          quantity: 4,
          unitPrice: 1250.0,
          taxRate: 10,
          taxAmount: 500.0,
          subtotal: 5000.0,
          total: 5500.0,
        },
      ],
      subtotal: 5000.0,
      taxTotal: 500.0,
      grandTotal: 5500.0,
      amountPaid: 3000.0,
      balanceDue: 2500.0,
      status: INVOICE_STATUSES.PARTIALLY_PAID,
      postedAt: new Date('2026-02-16'),
      postedBy: users[ROLES.ACCOUNTANT]._id,
      createdBy: users[ROLES.ACCOUNTANT]._id,
    });

    await Payment.create({
      companyId: company._id,
      paymentNumber: 'PAY-2026-0001',
      paymentType: 'CUSTOMER_RECEIPT',
      partyId: custAutomation._id,
      partyModel: 'Customer',
      invoiceId: inv1._id,
      amount: 3000.0,
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'WIRE-9923841',
      paymentDate: new Date('2026-02-20'),
      recordedBy: users[ROLES.ACCOUNTANT]._id,
      notes: 'Initial wire deposit for SO-2026-0001 / INV-2026-0001',
    });

    // 17. Create Operational Expenses
    console.log('💸 Creating operating expenses...');
    await Expense.create({
      companyId: company._id,
      expenseNumber: 'EXP-2026-0001',
      category: 'Utilities',
      title: 'Factory Electricity & Power Utility Bill',
      amount: 2450.0,
      paymentMethod: 'Bank Transfer',
      vendor: 'DTE Energy',
      expenseDate: new Date('2026-02-01'),
      status: 'approved',
      recordedBy: users[ROLES.ACCOUNTANT]._id,
    });
    await Expense.create({
      companyId: company._id,
      expenseNumber: 'EXP-2026-0002',
      category: 'Maintenance',
      title: 'CNC Mill Calibration & Spindle Service',
      amount: 850.0,
      paymentMethod: 'Credit Card',
      vendor: 'Precision Machining Services Inc.',
      expenseDate: new Date('2026-02-10'),
      status: 'approved',
      recordedBy: users[ROLES.ACCOUNTANT]._id,
    });

    // 18. Initialize Counters
    console.log('🔢 Initializing document sequence counters...');
    const currentYear = new Date().getFullYear();
    const counters = [
      { key: 'PO', seq: 1 },
      { key: 'GRN', seq: 1 },
      { key: 'WO', seq: 1 },
      { key: 'BOM', seq: 1 },
      { key: 'QC', seq: 1 },
      { key: 'NCR', seq: 1 },
      { key: 'SO', seq: 1 },
      { key: 'DSP', seq: 1 },
      { key: 'INV', seq: 1 },
      { key: 'PAY', seq: 1 },
      { key: 'EXP', seq: 2 },
      { key: 'MOV', seq: movCounter - 1 },
      { key: 'EMP', seq: 2 },
      { key: 'REQ', seq: 0 },
    ];
    for (const c of counters) {
      await Counter.create({ companyId: company._id, key: c.key, year: currentYear, seq: c.seq });
    }

    console.log('✅ SEEDING COMPLETE!');
    console.log('=====================================================');
    console.log('🔑 DEMO LOGIN CREDENTIALS (All passwords: Password123!)');
    console.log('-----------------------------------------------------');
    userCredentials.forEach((u) => {
      console.log(`- ${u.role.padEnd(25)}: ${u.email}`);
    });
    console.log('=====================================================');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (disconnectWhenDone) {
      await disconnectDB();
    }
  }
};

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
