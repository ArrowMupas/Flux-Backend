const pool = require("../database/pool");

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
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
};
