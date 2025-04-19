const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const errorMiddleware = require('./middlewares/errorMiddleware');

// route import
const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const cartRoute = require('./routes/cartRoute');

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

// error middleware
app.use(errorMiddleware);

// port
app.listen(process.env.PORT, () => {
    console.log(`Node API is running on port ${process.env.PORT}`);
});
