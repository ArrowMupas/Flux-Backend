const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const paymentModel = require('../models/paymentModel');
const productModel = require('../models/productModel');
const couponModel = require('../models/couponModel');
const HttpError = require('../helpers/errorHelper');
const { generateOrderId } = require('../helpers/orderIdHelper');
const { logInventoryChange } = require('../utilities/inventoryLogUtility');
const INVENTORY_ACTIONS = require('../constants/inventoryActions');

const validateCart = async (userId) => {
    const cart = await cartModel.getCartByUserId(userId);
    if (!cart) {
        throw new HttpError(404, 'Cart not found');
    }

    const cartData = await cartModel.getCartItemsByCartId(cart.id);
    if (!cartData.items || cartData.items.length === 0) {
        throw new HttpError(404, 'Cart is empty');
    }

    return {
        cart_id: cart.id,
        user_id: userId,
        cart_total: cartData.cart_total,
        final_total: cartData.final_total,
        coupon_code: cartData.coupon_code,
        discount: cartData.discount,
        items: cartData.items,
    };
};

const enforceOrderLimit = async (userId) => {
    const todayCount = await orderModel.getTodayOrderCountByUser(userId);
    if (todayCount >= 100) {
        throw new HttpError(429, "You've reached your 100 orders today. Try again tomorrow.");
    }
};

const createNewOrder = async ({
    userId,
    subtotal,
    total,
    discount = 0,
    coupon_code = null,
    notes,
    connection,
}) => {
    const orderId = generateOrderId();

    await orderModel.createOrder(
        {
            id: orderId,
            customer_id: userId,
            subtotal,
            total_amount: total,
            discount_amount: discount,
            coupon_code,
            status: 'pending',
            notes,
        },
        connection
    );

    if (coupon_code) {
        await couponModel.incrementUsage(coupon_code, connection);
        await couponModel.logUserCouponUsage(userId, coupon_code, connection);
    }

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
    createNewOrder,
    addItemsAndReserveStock,
    addOrderItem,
    validateAndFetchStock,
    reserveStock,
    logInventoryReservation,
    createInitialOrderStatus,
    handlePayment,
};
