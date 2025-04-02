const mysql = require("mysql2/promise");
require("dotenv").config();

// Create the database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Function to get all products
const getAllProducts = async () => {
  const [products] = await pool.query("SELECT * FROM products");
  return products;
};

// Function to get a product by ID
const getProductById = async (id) => {
  const [product] = await pool.query("SELECT * FROM products WHERE id = ?", [
    id,
  ]);
  return product[0];
};

// Function to add a new product
const addProduct = async (name, quantity, price, image) => {
  const [result] = await pool.query(
    "INSERT INTO products (name, quantity, price, image) VALUES (?, ?, ?, ?)",
    [name, quantity, price, image]
  );
  return result;
};

// Function to update a product
const updateProduct = async (id, name, quantity, price, image) => {
  const [result] = await pool.query(
    "UPDATE products SET name = ?, quantity = ?, price = ?, image = ? WHERE id = ?",
    [name, quantity, price, image, id]
  );
  return result;
};

// Function to delete a product
const deleteProduct = async (id) => {
  const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
  return result;
};

module.exports = {
  pool,
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
};
