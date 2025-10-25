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
    if (!cart) throw new HttpError(404, 'Cart not found');

    const items = await cartModel.getCartItemsWithDetails(cart.id);
    if (!items.length) throw new HttpError(404, 'Cart is empty');

    // Calculate totals
    const cart_total = parseFloat(items[0].cart_total || 0);
    const discount = parseFloat(cart.discount_total || 0);

    const formattedItems = items.map((row) => ({
        cart_item_id: row.cart_item_id,
        quantity: row.quantity,
        updated_at: row.item_updated_at,
        product_id: row.product_id,
        name: row.product_name,
        price: parseFloat(row.product_price || 0),
        image: row.product_image,
        stock_quantity: row.product_stock,
        description: row.product_description,
    }));

    return {
        cart_id: cart.id,
        user_id: cart.user_id,
        coupon_code: cart.coupon_code,
        discount,
        cart_total,
        final_total: Math.max(cart_total - discount, 0),
        items: formattedItems,
    };
};

const createNewOrder = async ({ userId, subtotal, total, discount = 0, coupon_code = null, notes, connection }) => {
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

        logInventoryReservation({
            item,
            stock,
            newReserved,
            newAvailable,
            orderId,
            userId,
            connection,
        }).catch((error) => {
            console.error('Failed to log inventory reservation:', error);
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
    await productModel.createProductReservation(item.product_id, orderId, item.quantity, connection);

    return { newReserved, newAvailable };
};

const logInventoryReservation = async ({ item, stock, newReserved, newAvailable, orderId, userId, connection }) => {
    return logInventoryChange({
        productId: item.product_id,
        orderId,
        userId,
        action: INVENTORY_ACTIONS.RESERVE,
        changeAvailable: -item.quantity,
        changeReserved: item.quantity,
        reason: 'Product ordered by user',
    });
};

const handlePayment = async ({ orderId, payment_method, reference_number, account_name, address, connection }) => {
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
    createNewOrder,
    addItemsAndReserveStock,
    addOrderItem,
    validateAndFetchStock,
    reserveStock,
    logInventoryReservation,
    handlePayment,
};
