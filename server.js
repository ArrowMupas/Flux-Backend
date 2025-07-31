const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorMiddleware = require('./middlewares/errorMiddleware');

// route import
const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const cartRoute = require('./routes/cartRoute');
const adminUserRoute = require('./routes/adminUserRoute');
const orderRoute = require('./routes/orderRoute');
const adminOrderRoute = require('./routes/adminOrderRoute');
const paymentRoute = require('./routes/paymentRoute');
const limitedOfferRoute = require('./routes/limitedOfferRoute');
const reviewRoute = require('./routes/reviewRoute');
const reportRoute = require('./routes/reportRoute');
const permissionRoute = require('./routes/permissionRoute');
const afterSalesRoute = require('./routes/afterSalesRoute');
const walkInOrderRoute = require('./routes/walkInOrderRoute');
const specialOfferRoute = require('./routes/specialOfferRoute');
const bundleRoute = require('./routes/bundleRoute');
const notificationRoute = require('./routes/notificationRoute');
const uploadRoute = require('./routes/uploadRoute');
const adminActivityLogRoute = require('./routes/adminActivityLogRoute');
const couponRoute = require('./routes/couponRoute');

// Cookies
app.use(cookieParser());

// CORS
const FRONTEND = process.env.FRONTEND;
const corsOptions = {
    origin: FRONTEND,
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// uses JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routes
app.use('/api/products', productRoute);
app.use('/api/users', userRoute);
app.use('/api/cart', cartRoute);
app.use('/api/adminUser', adminUserRoute);
app.use('/api/orders', orderRoute);
app.use('/api/adminOrder', adminOrderRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/limited-offer', limitedOfferRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/reports', reportRoute);
app.use('/api/permissions', permissionRoute);
app.use('/api/afterSales', afterSalesRoute);
app.use('/api/walkInOrders', walkInOrderRoute);
app.use('/api/special-offers', specialOfferRoute);
app.use('/api/bundles', bundleRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/admin-activity-logs', adminActivityLogRoute);
app.use('/api/coupons', couponRoute);
app.use('/api', uploadRoute);

// error middleware
app.use(errorMiddleware);

// port
app.listen(process.env.PORT, () => {
    console.log(`Node API is running on port ${process.env.PORT}`);
});
