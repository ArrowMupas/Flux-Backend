const express = require("express");
require("dotenv").config();
const productRoute = require("./routes/productRoute");
const errorMiddleware = require("./middlewares/errorMiddleware");
const cors = require("cors");

//express
const app = express();

//CORS
const FRONTEND = process.env.FRONTEND;
const corOptions = {
  origin: FRONTEND,
  optionsSuccessStatus: 200,
};

app.use(cors(corOptions));

// uses JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routes
app.use("/api/products", productRoute);

//error middleware
app.use(errorMiddleware);

//port
app.listen(process.env.PORT, () => {
  console.log(`Node API is running on port ${process.env.PORT}`);
});
