const express = require('express');
const app = express();
app.set('trust proxy', 1);
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const errorMiddleware = require('./middlewares/errorMiddleware');
const http = require('http');

// route import
const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const cartRoute = require('./routes/cartRoute');
const adminUserRoute = require('./routes/adminUserRoute');
const orderRoute = require('./routes/orderRoute');
const adminOrderRoute = require('./routes/adminOrderRoute');
const paymentRoute = require('./routes/paymentRoute');
const reviewRoute = require('./routes/reviewRoute');
const reportRoute = require('./routes/reportRoute');
const permissionRoute = require('./routes/permissionRoute');
const walkInOrderRoute = require('./routes/walkInOrderRoute');
const uploadRoute = require('./routes/uploadRoute');
const couponRoute = require('./routes/couponRoute');
const logRoute = require('./routes/logRoute');
const inventoryNotificationRoute = require('./routes/inventoryNotificationRoute');
const dashboardRoute = require('./routes/dashboardRoute');
const salesRoute = require('./routes/salesRoute');
const returnRoute = require('./routes/returnRoute');

// security & optimization
app.use(helmet());
app.use(compression());

// CORS
const FRONTEND = process.env.FRONTEND;
const corsOptions = {
    origin: FRONTEND,
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Cookies
app.use(cookieParser());

// uses JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// routes
app.use('/api/products', productRoute);
app.use('/api/users', userRoute);
app.use('/api/cart', cartRoute);
app.use('/api/adminUser', adminUserRoute);
app.use('/api/orders', orderRoute);
app.use('/api/adminOrder', adminOrderRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/reports', reportRoute);
app.use('/api/permissions', permissionRoute);
app.use('/api/walkInOrders', walkInOrderRoute);
app.use('/api/coupons', couponRoute);
app.use('/api/inventory-notifications', inventoryNotificationRoute);
app.use('/api/logs', logRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/sales', salesRoute);
app.use('/api/returns', returnRoute);

// 404 for unhandled routes
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// error middleware
app.use(errorMiddleware);

// Create HTTP server and attach Express app
const server = http.createServer(app);
const initializeSocket = require('./utilities/socket');

const io = initializeSocket(server, app, FRONTEND);

// Start server
server.listen(process.env.PORT, () => {
    console.log(`🚀 Alas BackEnd is now Running!`);
});
