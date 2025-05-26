const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const errorMiddleware = require('./middlewares/errorMiddleware');

// route import
const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const cartRoute = require('./routes/cartRoute');
const admiUserRoute = require('./routes/adminUserRoute');
const orderRoute = require('./routes/orderRoute');
const adminOrderRoute = require('./routes/adminOrderRoute');
const paymentRoute = require('./routes/paymentRoute');
const limitedOfferRoute = require('./routes/limitedOfferRoute');
const reviewRoute = require('./routes/reviewRoute');
const reportRoute = require('./routes/reportRoute');
const permissionRoute = require('./routes/permissionRoute');

// CORS
const FRONTEND = process.env.FRONTEND;
const corOptions = {
    origin: FRONTEND,
    optionsSuccessStatus: 200,
};

app.use(cors(corOptions));

// uses JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routes
app.use('/api/products', productRoute);
app.use('/api/users', userRoute);
app.use('/api/cart', cartRoute);
app.use('/api/adminUser', admiUserRoute);
app.use('/api/orders', orderRoute);
app.use('/api/adminOrder', adminOrderRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/limited-offer', limitedOfferRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/reports', reportRoute);
app.use('/api/permissions', permissionRoute);

// error middleware
app.use(errorMiddleware);

// port
app.listen(process.env.PORT, () => {
    console.log(`Node API is running on port ${process.env.PORT}`);
});
