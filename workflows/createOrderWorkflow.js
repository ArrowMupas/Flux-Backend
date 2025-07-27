const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const paymentModel = require('../models/paymentModel');
const productModel = require('../models/productModel');
const couponService = require('../services/couponService');
const HttpError = require('../helpers/errorHelper');
const { generateOrderId } = require('../helpers/orderIdHelper');
const { logInventoryChange } = require('../utilities/inventoryLogUtility');
const INVENTORY_ACTIONS = require('../constants/inventoryActions');

const validateCart = async (userId) => {
    const cart = await cartModel.getCartItemsByUserId(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
        throw new HttpError(404, 'Cart is empty');
    }
    return cart;
};

const enforceOrderLimit = async (userId) => {
    const todayCount = await orderModel.getTodayOrderCountByUser(userId);
    if (todayCount >= 100) {
        throw new HttpError(429, "You've reached your 100 orders today. Try again tomorrow.");
    }
};

const applyCoupon = async (code, cartTotal) => {
    return await couponService.applyCouponToOrder(code, cartTotal);
};

const createNewOrder = async ({ userId, total, discount, coupon, notes, connection }) => {
    const orderId = generateOrderId();
    await orderModel.createOrder(
        {
            id: orderId,
            customer_id: userId,
            total_amount: total,
            discount_amount: discount,
            coupon_code: coupon ? coupon.code : null,
            status: 'pending',
            notes,
        },
        connection
    );
    return orderId;
};

const addItemsAndReserveStock = async ({ cart, orderId, userId, connection }) => {
    for (const item of cart.items) {
        await addOrderItem(item, orderId, connection);
        const stock = await validateAndFetchStock(item.product_id, item.quantity, connection);
        const { newReserved, newAvailable } = await reserveStock(item, orderId, stock, connection);
        await logInventoryReservation({
            item,
            stock,
            newReserved,
            newAvailable,
            orderId,
            userId,
            connection,
        });
    }
};

const addOrderItem = async (item, orderId, connection) => {
    await orderModel.addOrderItem(
        {
            order_id: orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.price * item.quantity,
        },
        connection
    );
};

const validateAndFetchStock = async (productId, quantity, connection) => {
    const stock = await productModel.getProductStockForUpdate(productId, connection);
    if (!stock) {
        throw new HttpError(404, `Product ${productId} not found`);
    }

    const available = stock.stock_quantity - stock.reserved_quantity;
    if (available < quantity) {
        throw new HttpError(400, `Not enough available stock for product ${productId}`);
    }

    return stock;
};

const reserveStock = async (item, orderId, stock, connection) => {
    const newReserved = stock.reserved_quantity + item.quantity;
    const newAvailable = stock.stock_quantity - newReserved;

    await productModel.updateReservedQuantity(item.product_id, newReserved, connection);
    await productModel.createProductReservation(
        item.product_id,
        orderId,
        item.quantity,
        connection
    );

    return { newReserved, newAvailable };
};

const logInventoryReservation = async ({
    item,
    stock,
    newReserved,
    newAvailable,
    orderId,
    userId,
    connection,
}) => {
    await logInventoryChange({
        productId: item.product_id,
        orderId,
        userId,
        action: INVENTORY_ACTIONS.RESERVE,
        changeAvailable: -item.quantity,
        oldAvailable: stock.stock_quantity - stock.reserved_quantity,
        newAvailable,
        changeReserved: item.quantity,
        oldReserved: stock.reserved_quantity,
        newReserved,
        dbConnection: connection,
    });
};

const createInitialOrderStatus = async (orderId, connection) => {
    await orderModel.createOrderStatus(
        {
            orderId,
            newStatus: 'pending',
            notes: 'pending',
        },
        connection
    );
};

const handlePayment = async ({
    orderId,
    payment_method,
    reference_number,
    account_name,
    address,
    connection,
}) => {
    const existing = await paymentModel.getPaymentByOrderId(orderId, connection);
    if (existing) {
        throw new HttpError(400, 'Payment for this order already submitted');
    }

    return await paymentModel.createPayment(
        orderId,
        payment_method,
        reference_number,
        account_name,
        address,
        connection
    );
};

module.exports = {
    validateCart,
    enforceOrderLimit,
    applyCoupon,
    createNewOrder,
    addItemsAndReserveStock,
    addOrderItem,
    validateAndFetchStock,
    reserveStock,
    logInventoryReservation,
    createInitialOrderStatus,
    handlePayment,
};
