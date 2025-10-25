const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
    {
        productId: { type: String, required: true },
        orderId: { type: String, default: null },
        userId: { type: String, default: null },
        adminId: { type: String, default: null },
        action: { type: String, required: true },
        changeAvailable: { type: Number, required: true },
        changeReserved: { type: Number, default: 0 },
        reason: { type: String, default: null },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
