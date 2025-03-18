const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

app.use(express.json())
app.use(express.urlencoded({extended: false}))

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'arrow',  // Your MySQL password
    database: 'Try',    // Your database name
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//routes
app.get('/', (req, res) => {
    res.send('Hello Node API')
})

app.get('/blog', (req, res) => {
    res.send('Hello Blog World')
})

// Get all products
app.get('/products', async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single product by ID
app.get('/products/:id', async (req, res) => {
    try {
        const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (product.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(product[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new product
app.post('/products', async (req, res) => {
    try {
        const { name, quantity, price, image } = req.body;
        const [result] = await pool.query(
            'INSERT INTO products (name, quantity, price, image) VALUES (?, ?, ?, ?)',
            [name, quantity, price, image]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a product
app.put('/products/:id', async (req, res) => {
    try {
        const { name, quantity, price, image } = req.body;
        const [result] = await pool.query(
            'UPDATE products SET name = ?, quantity = ?, price = ?, image = ? WHERE id = ?',
            [name, quantity, price, image, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a product
app.delete('/products/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(3000, ()=>{
    console.log('Node API is running on port 3000')
})