const express = require("express");
require("dotenv").config();
const productRoute = require("./routes/productRoute");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routes
app.use("/api", productRoute);

app.listen(process.env.PORT, () => {
  console.log(`Node API is running on port ${process.env.PORT}`);
});
