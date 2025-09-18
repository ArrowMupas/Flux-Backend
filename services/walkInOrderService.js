const walkInOrderModel = require('../models/walkInOrderModel');
const productModel = require('../models/productModel');
const HttpError = require('../helpers/errorHelper');
const { generateOrderId } = require('../helpers/orderIdHelper');
const { withTransaction } = require('../helpers/transactionHelper');

// Logic to create a walk-in sale
const createWalkInSale = async (name, email, items, discount_amount = 0, notes = '') => {
    return withTransaction(async (connection) => {
        const generatedID = generateOrderId();
        await walkInOrderModel.createOrder(
            {
                id: generatedID,
                customer_name: name,
                customer_email: email,
                total_amount: 0,
                discount_amount,
                notes,
            },
            connection
        );

        let total = 0;
        for (const item of items) {
            const unit_price = await productModel.getProductPrice(item.product_id, connection);
            if (!unit_price) {
                throw new HttpError(400, `Product ${item.product_id} not found.`);
            }

            const subtotal = unit_price * item.quantity;
            total += subtotal;

            await walkInOrderModel.addOrderItem(
                {
                    sale_id: generatedID,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price,
                    subtotal,
                },
                connection
            );

            await walkInOrderModel.deductStock(item.product_id, item.quantity, connection);
        }

        const finalTotal = total - discount_amount;
        await walkInOrderModel.updateOrderTotal(generatedID, finalTotal, connection);

        return { generatedID };
    });
};

// Logic to get all walk-in sales with their items
const getAllWalkInSales = async () => {
    return await walkInOrderModel.getAllWalkInSalesWithItems();
};

module.exports = { createWalkInSale, getAllWalkInSales };
