import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../scripts/seed.js';

describe('Manufacturing ERP End-to-End API Test Suite', () => {
  let adminToken = '';
  let productionToken = '';
  let companyId = '';
  let rawMaterialId = '';
  let finishedGoodId = '';
  let warehouseId = '';
  let supplierId = '';
  let customerId = '';
  let bomId = '';

  beforeAll(async () => {
    // Connect first, then seed without disconnecting so connection remains active for test suite
    await connectDB();
    await seedDatabase(false);

    // Log in as Super Admin
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@apex.com',
      password: 'Password123!',
    });
    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.data.token).toBeDefined();
    adminToken = adminLogin.body.data.token;
    companyId = adminLogin.body.data.user.company.id;

    // Log in as Production Manager
    const prodLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'production@apex.com',
      password: 'Password123!',
    });
    expect(prodLogin.status).toBe(200);
    productionToken = prodLogin.body.data.token;
  }, 45000);

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. System Health & Authentication', () => {
    it('GET / returns 200 and API metadata', async () => {
      const res = await request(app).get('/').set('Accept', 'application/json');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
    });

    it('GET /health returns healthy', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('healthy');
    });

    it('GET /api/v1/health returns healthy', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('healthy');
    });

    it('POST /api/v1/auth/login rejects invalid password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@apex.com',
        password: 'WrongPassword!',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /auth/login resolves without /api/v1 prefix alias', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'admin@apex.com',
        password: 'Password123!',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('GET /api/v1/auth/me returns user profile and permissions', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin@apex.com');
      expect(res.body.data.permissions.length).toBeGreaterThan(0);
    });

    it('PUT /api/v1/auth/update-profile updates user profile successfully', async () => {
      const res = await request(app)
        .put('/api/v1/auth/update-profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Arthur Administrator Updated' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Arthur Administrator Updated');
    });
  });

  describe('2. Master Data Management & Business Rules', () => {
    it('Fetch master warehouses, categories, suppliers, and customers', async () => {
      const whRes = await request(app)
        .get('/api/v1/warehouses')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(whRes.status).toBe(200);
      expect(whRes.body.data.length).toBeGreaterThan(0);
      warehouseId = whRes.body.data[0]._id;

      const suppRes = await request(app)
        .get('/api/v1/suppliers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(suppRes.status).toBe(200);
      supplierId = suppRes.body.data[0]._id;

      const custRes = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(custRes.status).toBe(200);
      customerId = custRes.body.data[0]._id;
    });

    it('Create raw material product and verify duplicate SKU rejection', async () => {
      const catRes = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`);
      const categoryId = catRes.body.data[0]._id;

      const testSku = 'TEST-RM-TITANIUM-' + Date.now();
      const createRes = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: testSku,
          name: 'Grade 5 Titanium Bar',
          category: categoryId,
          itemType: 'raw_material',
          uom: 'pcs',
          standardCost: 120.0,
          reorderLevel: 10,
        });
      expect(createRes.status).toBe(201);
      rawMaterialId = createRes.body.data._id;

      // Duplicate SKU rejection
      const duplicateRes = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: testSku,
          name: 'Duplicate Titanium Bar',
          category: categoryId,
          itemType: 'raw_material',
          uom: 'pcs',
        });
      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
    });
  });

  describe('3. Inventory Ledger & Immutability', () => {
    it('Stock adjustment creates immutable stock movement', async () => {
      const adjRes = await request(app)
        .post('/api/v1/inventory/adjustments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: rawMaterialId,
          warehouseId,
          adjustmentQuantity: 50,
          reason: 'Initial physical inventory count audit',
        });
      expect(adjRes.status).toBe(201);
      expect(adjRes.body.data.balance.onHand).toBe(50);
      expect(adjRes.body.data.movement.movementNumber).toBeDefined();

      // Check stock overview
      const overviewRes = await request(app)
        .get('/api/v1/inventory/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(overviewRes.status).toBe(200);
      const found = overviewRes.body.data.find((i) => i.product.id === rawMaterialId);
      expect(found).toBeDefined();
      expect(found.totalOnHand).toBe(50);
    });

    it('Rejects negative stock by default when insufficient balance', async () => {
      const failAdj = await request(app)
        .post('/api/v1/inventory/adjustments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: rawMaterialId,
          warehouseId,
          adjustmentQuantity: -100, // onHand is 50, reduction is 100
          reason: 'Excess deduction test',
        });
      expect(failAdj.status).toBe(400);
      expect(failAdj.body.message).toContain('Insufficient stock');
    });

    it('Reconcile stock balance against immutable movement ledger', async () => {
      const recRes = await request(app)
        .get(`/api/v1/inventory/reconcile?productId=${rawMaterialId}&warehouseId=${warehouseId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(recRes.status).toBe(200);
      expect(recRes.body.data.isConsistent).toBe(true);
      expect(recRes.body.data.onHand).toBe(50);
      expect(recRes.body.data.ledgerSum).toBe(50);
    });
  });

  describe('4. Procurement Workflow (PO -> Goods Receipt -> Inventory)', () => {
    let poId = '';

    it('Create and approve purchase order', async () => {
      const poRes = await request(app)
        .post('/api/v1/procurement/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          supplierId,
          items: [
            {
              productId: rawMaterialId,
              quantity: 20,
              unitPrice: 110.0,
              taxRate: 5,
            },
          ],
          paymentTerms: 'Net 30',
        });
      expect(poRes.status).toBe(201);
      expect(poRes.body.data.poNumber).toBeDefined();
      expect(poRes.body.data.grandTotal).toBe(2310.0);
      poId = poRes.body.data._id;

      // Approve PO
      const approveRes = await request(app)
        .post(`/api/v1/procurement/orders/${poId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('approved');
    });

    it('Receive goods partially and update inventory ledger', async () => {
      const grnRes = await request(app)
        .post('/api/v1/procurement/receive')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          purchaseOrderId: poId,
          warehouseId,
          deliveryNoteNumber: 'DN-TEST-001',
          items: [
            {
              productId: rawMaterialId,
              receivedQuantity: 10,
              acceptedQuantity: 10,
              rejectedQuantity: 0,
            },
          ],
        });
      expect(grnRes.status).toBe(201);
      expect(grnRes.body.data.goodsReceipt.grnNumber).toBeDefined();
      expect(grnRes.body.data.purchaseOrder.status).toBe('partially_received');

      // Check that raw material stock increased by 10 (from 50 to 60)
      const recRes = await request(app)
        .get(`/api/v1/inventory/reconcile?productId=${rawMaterialId}&warehouseId=${warehouseId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(recRes.body.data.onHand).toBe(60);
    });

    it('Prevents over-receiving beyond remaining PO quantity', async () => {
      // Ordered 20, already received 10, remaining is 10. Trying to receive 15:
      const overReceiveRes = await request(app)
        .post('/api/v1/procurement/receive')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          purchaseOrderId: poId,
          warehouseId,
          items: [
            {
              productId: rawMaterialId,
              receivedQuantity: 15,
              acceptedQuantity: 15,
            },
          ],
        });
      expect(overReceiveRes.status).toBe(400);
      expect(overReceiveRes.body.message).toContain('Remaining expected: 10');
    });
  });

  describe('5. Bill of Materials & Production Workflow', () => {
    let testFinishedGoodId = '';
    let testBomId = '';
    let workOrderId = '';

    it('Create BOM and prevent circular dependency', async () => {
      const catRes = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`);
      const categoryId = catRes.body.data[0]._id;

      const fgRes = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: 'FG-TEST-ROBOT-' + Date.now(),
          name: 'Precision Test Drone',
          category: categoryId,
          itemType: 'finished_good',
          uom: 'pcs',
          standardCost: 250.0,
          sellingPrice: 750.0,
        });
      testFinishedGoodId = fgRes.body.data._id;

      // Circular dependency test: cannot add output product as component
      const circRes = await request(app)
        .post('/api/v1/boms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: testFinishedGoodId,
          outputQuantity: 1,
          components: [
            { productId: testFinishedGoodId, quantity: 1 }, // self-reference
          ],
        });
      expect(circRes.status).toBe(400);
      expect(circRes.body.message).toContain('Circular dependency detected');

      // Create valid BOM
      const bomRes = await request(app)
        .post('/api/v1/boms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: testFinishedGoodId,
          outputQuantity: 1,
          components: [
            { productId: rawMaterialId, quantity: 2, scrapPercentage: 0, unitCost: 120.0 },
          ],
        });
      expect(bomRes.status).toBe(201);
      testBomId = bomRes.body.data._id;
    });

    it('Calculate material requirements for production quantity', async () => {
      const calcRes = await request(app)
        .post('/api/v1/boms/calculate-requirements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bomId: testBomId,
          plannedQuantity: 5,
          warehouseId,
        });
      expect(calcRes.status).toBe(200);
      expect(calcRes.body.data.requirements[0].requiredQuantity).toBe(10);
      expect(calcRes.body.data.hasShortage).toBe(false); // we have 60 in stock
    });

    it('Create, release, issue materials, report and complete work order', async () => {
      // Create Work Order for 5 units
      const woRes = await request(app)
        .post('/api/v1/production')
        .set('Authorization', `Bearer ${productionToken}`)
        .send({
          productId: testFinishedGoodId,
          bomId: testBomId,
          plannedQuantity: 5,
          destinationWarehouseId: warehouseId,
          sourceWarehouseId: warehouseId,
        });
      expect(woRes.status).toBe(201);
      workOrderId = woRes.body.data._id;

      // Release Work Order (reserves 10 raw materials)
      const relRes = await request(app)
        .post(`/api/v1/production/${workOrderId}/release`)
        .set('Authorization', `Bearer ${productionToken}`);
      expect(relRes.status).toBe(200);
      expect(relRes.body.data.status).toBe('released');

      // Issue materials (deducts 10 raw materials from stock, stock moves 60 -> 50)
      const issueRes = await request(app)
        .post(`/api/v1/production/${workOrderId}/issue-materials`)
        .set('Authorization', `Bearer ${productionToken}`);
      expect(issueRes.status).toBe(200);
      expect(issueRes.body.data.status).toBe('in_progress');

      // Report production (5 accepted)
      const reportRes = await request(app)
        .post(`/api/v1/production/${workOrderId}/report`)
        .set('Authorization', `Bearer ${productionToken}`)
        .send({ acceptedQuantity: 5 });
      expect(reportRes.status).toBe(200);

      // Complete work order (adds 5 finished goods to stock)
      const compRes = await request(app)
        .post(`/api/v1/production/${workOrderId}/complete`)
        .set('Authorization', `Bearer ${productionToken}`)
        .send({ acceptedQuantity: 5, batchNumber: 'BATCH-2026-X1' });
      expect(compRes.status).toBe(200);
      expect(compRes.body.data.status).toBe('completed');

      // Verify Finished Goods stock is now 5
      const fgRec = await request(app)
        .get(`/api/v1/inventory/reconcile?productId=${testFinishedGoodId}&warehouseId=${warehouseId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(fgRec.body.data.onHand).toBe(5);
    });
  });

  describe('6. Sales, Dispatch, Invoicing & Payments', () => {
    let salesOrderId = '';
    let invoiceId = '';

    it('Create and approve Sales Order', async () => {
      // Find an available finished good
      const prodRes = await request(app)
        .get('/api/v1/products?itemType=finished_good')
        .set('Authorization', `Bearer ${adminToken}`);
      const fgItem = prodRes.body.data[0];

      const soRes = await request(app)
        .post('/api/v1/sales/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId,
          items: [
            {
              productId: fgItem._id,
              quantity: 2,
              unitPrice: 1000.0,
              taxRate: 10,
            },
          ],
        });
      expect(soRes.status).toBe(201);
      salesOrderId = soRes.body.data._id;

      // Approve Sales Order
      const appRes = await request(app)
        .post(`/api/v1/sales/orders/${salesOrderId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(appRes.status).toBe(200);
      expect(appRes.body.data.status).toBe('approved');
    });

    it('Dispatch goods and verify inventory reduction', async () => {
      const soRes = await request(app)
        .get(`/api/v1/sales/orders/${salesOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const item = soRes.body.data.salesOrder.items[0];

      const dspRes = await request(app)
        .post('/api/v1/sales/dispatches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          salesOrderId,
          warehouseId,
          carrier: 'DHL Express',
          trackingNumber: 'TRK-99412',
          items: [
            {
              productId: item.product?._id || item.product,
              dispatchQuantity: 2,
            },
          ],
        });
      expect(dspRes.status).toBe(201);
      expect(dspRes.body.data.dispatch.dispatchNumber).toBeDefined();
      expect(dspRes.body.data.salesOrder.status).toBe('fulfilled');
    });

    it('Create invoice, post invoice to accounts receivable, and record payment', async () => {
      const prodRes = await request(app)
        .get('/api/v1/products?itemType=finished_good')
        .set('Authorization', `Bearer ${adminToken}`);
      const fgItem = prodRes.body.data[0];

      const invRes = await request(app)
        .post('/api/v1/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId,
          salesOrderId,
          dueDate: new Date(Date.now() + 30 * 86400000),
          items: [
            {
              productId: fgItem._id,
              quantity: 2,
              unitPrice: 1000.0,
              taxRate: 10,
            },
          ],
        });
      expect(invRes.status).toBe(201);
      expect(invRes.body.data.grandTotal).toBe(2200.0);
      expect(invRes.body.data.balanceDue).toBe(2200.0);
      invoiceId = invRes.body.data._id;

      // Post invoice
      const postRes = await request(app)
        .post(`/api/v1/invoices/${invoiceId}/post`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(postRes.status).toBe(200);
      expect(postRes.body.data.status).toBe('posted');

      // Record partial payment of $1200
      const payRes = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentType: 'CUSTOMER_RECEIPT',
          partyId: customerId,
          invoiceId,
          amount: 1200.0,
          paymentMethod: 'Bank Transfer',
          referenceNumber: 'WIRE-TEST-123',
        });
      expect(payRes.status).toBe(201);

      // Verify invoice balance due is now 1000.0 and status is partially_paid
      const updatedInv = await request(app)
        .get(`/api/v1/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(updatedInv.body.data.invoice.balanceDue).toBe(1000.0);
      expect(updatedInv.body.data.invoice.status).toBe('partially_paid');
    });
  });

  describe('7. Dashboard & Reporting Aggregates', () => {
    it('GET /api/v1/dashboard/metrics returns calculated live metrics', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/metrics')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalSales).toBeGreaterThan(0);
      expect(res.body.data.summary.totalInventoryValue).toBeGreaterThan(0);
      expect(res.body.data.charts.monthlySalesAndPurchases.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/reports/inventory-valuation returns report with grand total', async () => {
      const res = await request(app)
        .get('/api/v1/reports/inventory-valuation')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.grandTotalValuation).toBeGreaterThan(0);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/reports/invoice-aging returns aging buckets', async () => {
      const res = await request(app)
        .get('/api/v1/reports/invoice-aging')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.totalOutstanding).toBeGreaterThan(0);
      expect(res.body.data.records.length).toBeGreaterThan(0);
    });
  });
});
