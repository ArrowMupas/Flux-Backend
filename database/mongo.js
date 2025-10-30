const mongoose = require('mongoose');

// MONGO BECAUSE WHY NOT
async function connectMongo() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('❌ MONGO_URI missing in .env');
        return;
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(' MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
    }

    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
    });
}

module.exports = connectMongo;
