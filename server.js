const express = require("express");
require("dotenv").config();
const productRoute = require("./routes/productRoute");
const errorMiddleware = require("./middlewares/errorMiddleware");
const cors = require("cors");

const app = express();

const FRONTEND = process.env.FRONTEND;
const corOptions = {
  origin: FRONTEND,
  optionsSuccessStatus: 200,
};

app.use(cors(corOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routes
app.use("/api/products", productRoute);

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`Node API is running on port ${process.env.PORT}`);
});
