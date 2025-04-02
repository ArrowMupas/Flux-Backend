const express = require("express");
const router = express.Router();
const productModel = require("../models/productModel");

// Get all products
router.get("/products", async (req, res) => {
  try {
    const products = await productModel.getAllProducts();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single product by ID
router.get("/products/:id", async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new product
router.post("/products", async (req, res) => {
  try {
    const { name, quantity, price, image } = req.body;
    const result = await productModel.addProduct(name, quantity, price, image);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a product
router.put("/products/:id", async (req, res) => {
  try {
    const { name, quantity, price, image } = req.body;
    const result = await productModel.updateProduct(
      req.params.id,
      name,
      quantity,
      price,
      image
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a product
router.delete("/products/:id", async (req, res) => {
  try {
    const result = await productModel.deleteProduct(req.params.id);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
