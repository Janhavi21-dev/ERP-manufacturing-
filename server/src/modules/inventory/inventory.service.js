import { StockBalance } from './stockBalance.model.js';
import { StockMovement } from './stockMovement.model.js';
import { Product } from '../products/product.model.js';
import { Company } from '../company/company.model.js';
import { ApiError } from '../../utils/apiError.js';
import { getNextSequence } from '../../utils/sequenceGenerator.js';
import { STOCK_MOVEMENT_TYPES } from '../../config/constants.js';

export class InventoryService {
  /**
   * Record a stock movement and atomically update the warehouse balance
   */
  static async recordStockMovement({
    companyId,
    productId,
    warehouseId,
    type,
    quantity,
    unitCost = 0,
    batchNumber = null,
    referenceType,
    referenceId = null,
    referenceNumber = null,
    user = null,
    notes = '',
    session = null,
    allowNegativeOverride = false,
  }) {
    if (quantity === 0) {
      throw ApiError.badRequest('Movement quantity cannot be zero');
    }

    const company = await Company.findById(companyId).session(session);
    const allowNegative = allowNegativeOverride || company?.settings?.allowNegativeStock || false;

    // Find or create StockBalance
    let balance = await StockBalance.findOne({
      companyId,
      productId,
      warehouseId,
    }).session(session);

    if (!balance) {
      balance = new StockBalance({
        companyId,
        productId,
        warehouseId,
        onHand: 0,
        reserved: 0,
        quarantined: 0,
        allocated: 0,
      });
    }

    // Check negative stock prevention if reducing inventory
    const newOnHand = balance.onHand + quantity;
    if (newOnHand < 0 && !allowNegative) {
      const product = await Product.findById(productId).session(session);
      throw ApiError.badRequest(
        `Insufficient stock for '${product?.name || productId}'. Current on-hand: ${balance.onHand}, Requested reduction: ${Math.abs(quantity)}`
      );
    }

    balance.onHand = Math.round(newOnHand * 10000) / 10000;
    balance.lastMovementAt = new Date();
    await balance.save({ session });

    // Generate unique movement number
    const movementNumber = await getNextSequence(companyId, 'MOV', 'MOV', 5, session);

    // Create immutable stock movement record
    const movement = new StockMovement({
      companyId,
      movementNumber,
      productId,
      warehouseId,
      type,
      quantity,
      balanceAfter: balance.onHand,
      unitCost,
      totalCost: Math.round(Math.abs(quantity) * unitCost * 100) / 100,
      batchNumber,
      referenceType,
      referenceId: referenceId ? String(referenceId) : null,
      referenceNumber,
      userId: user?._id || user?.id || null,
      userName: user?.name || 'System',
      notes,
      timestamp: new Date(),
    });

    await movement.save({ session });

    return { movement, balance };
  }

  /**
   * Reserve stock for a work order or sales allocation
   */
  static async reserveStock({ companyId, productId, warehouseId, quantity, session = null }) {
    if (quantity <= 0) {
      throw ApiError.badRequest('Reservation quantity must be greater than zero');
    }

    const balance = await StockBalance.findOne({ companyId, productId, warehouseId }).session(session);
    if (!balance) {
      throw ApiError.badRequest('No stock record found for this product in the selected warehouse');
    }

    const available = balance.onHand - balance.reserved - balance.quarantined;
    if (available < quantity) {
      const product = await Product.findById(productId).session(session);
      throw ApiError.badRequest(
        `Insufficient available stock for '${product?.name || productId}'. Available: ${available}, Required: ${quantity}`
      );
    }

    balance.reserved = Math.round((balance.reserved + quantity) * 10000) / 10000;
    await balance.save({ session });
    return balance;
  }

  /**
   * Release reserved stock
   */
  static async releaseReservation({ companyId, productId, warehouseId, quantity, session = null }) {
    const balance = await StockBalance.findOne({ companyId, productId, warehouseId }).session(session);
    if (balance) {
      balance.reserved = Math.max(0, Math.round((balance.reserved - quantity) * 10000) / 10000);
      await balance.save({ session });
    }
    return balance;
  }

  /**
   * Transfer stock between warehouses
   */
  static async transferStock({
    companyId,
    productId,
    fromWarehouseId,
    toWarehouseId,
    quantity,
    user,
    notes,
    session = null,
  }) {
    if (String(fromWarehouseId) === String(toWarehouseId)) {
      throw ApiError.badRequest('Source and destination warehouses cannot be the same');
    }

    if (quantity <= 0) {
      throw ApiError.badRequest('Transfer quantity must be greater than zero');
    }

    const refNumber = await getNextSequence(companyId, 'TRF', 'TRF', 4, session);

    // Deduct from source warehouse
    const outResult = await this.recordStockMovement({
      companyId,
      productId,
      warehouseId: fromWarehouseId,
      type: STOCK_MOVEMENT_TYPES.STOCK_TRANSFER_OUT,
      quantity: -quantity,
      referenceType: 'STOCK_TRANSFER',
      referenceNumber: refNumber,
      user,
      notes: `Transfer to warehouse: ${notes || ''}`,
      session,
    });

    // Add to destination warehouse
    const inResult = await this.recordStockMovement({
      companyId,
      productId,
      warehouseId: toWarehouseId,
      type: STOCK_MOVEMENT_TYPES.STOCK_TRANSFER_IN,
      quantity,
      referenceType: 'STOCK_TRANSFER',
      referenceNumber: refNumber,
      user,
      notes: `Transfer from warehouse: ${notes || ''}`,
      session,
    });

    return { refNumber, outResult, inResult };
  }

  /**
   * Adjust stock manually with audit justification
   */
  static async adjustStock({
    companyId,
    productId,
    warehouseId,
    adjustmentQuantity, // positive or negative
    reason,
    user,
    session = null,
  }) {
    if (adjustmentQuantity === 0) {
      throw ApiError.badRequest('Adjustment quantity cannot be zero');
    }

    const type =
      adjustmentQuantity > 0
        ? STOCK_MOVEMENT_TYPES.STOCK_ADJUSTMENT_POSITIVE
        : STOCK_MOVEMENT_TYPES.STOCK_ADJUSTMENT_NEGATIVE;

    const refNumber = await getNextSequence(companyId, 'ADJ', 'ADJ', 4, session);

    return await this.recordStockMovement({
      companyId,
      productId,
      warehouseId,
      type,
      quantity: adjustmentQuantity,
      referenceType: 'STOCK_ADJUSTMENT',
      referenceNumber: refNumber,
      user,
      notes: `Stock adjustment: ${reason}`,
      session,
    });
  }

  /**
   * Reconcile warehouse stock against immutable ledger movements
   */
  static async reconcileStock({ companyId, productId, warehouseId }) {
    const movements = await StockMovement.find({ companyId, productId, warehouseId });
    const ledgerSum = movements.reduce((acc, m) => acc + m.quantity, 0);

    const balance = await StockBalance.findOne({ companyId, productId, warehouseId });
    const onHand = balance ? balance.onHand : 0;

    const isConsistent = Math.abs(ledgerSum - onHand) < 0.0001;

    return {
      productId,
      warehouseId,
      onHand,
      ledgerSum: Math.round(ledgerSum * 10000) / 10000,
      discrepancy: Math.round((onHand - ledgerSum) * 10000) / 10000,
      isConsistent,
    };
  }
}
