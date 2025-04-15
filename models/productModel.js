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
const addProduct = async (
  id,
  name,
  category,
  stock_quantity,
  price,
  image,
  description
) => {
  const [result] = await pool.query(
    "INSERT INTO products (id, name, category, stock_quantity, price, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, name, category, stock_quantity, price, image, description]
  );
  return result;
};

// Function to update a product
const updateProduct = async (
  id,
  name,
  category,
  stock_quantity,
  price,
  image,
  description
) => {
  const [result] = await pool.query(
    "UPDATE products SET name = ?, category = ?, stock_quantity = ?, price = ?, image = ?, description = ? WHERE id = ?",
    [name, category, stock_quantity, price, image, description, id]
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
