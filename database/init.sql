CREATE DATABASE IF NOT EXISTS sauce;
USE sauce;

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    stock_quantity INT NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(100) UNIQUE NOT NULL,  
    description TEXT   
);

INSERT INTO roles (name, description) VALUES
('admin', 'Administrator role with full permissions'),
('customer', 'Customer role with limited permissions'),
('staff', 'Staff role with controlled permissions');

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    contact_number VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_product UNIQUE (user_id, product_id),
    INDEX (product_id)
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    cancel_requested BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    INDEX (customer_id),
    INDEX (order_date),
    INDEX (status)
);

CREATE TABLE IF NOT EXISTS order_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX (order_id),
    INDEX (product_id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'cancel_requested', 'refunded') NOT NULL,
    status_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX (order_id),
    INDEX (status_date)
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    method ENUM('GCash', 'Maya', 'bank_transfer') NOT NULL,
    reference_number VARCHAR(100) NOT NULL,
    account_name VARCHAR(100),
    address  VARCHAR(255),  
    status ENUM('submitted', 'verified', 'failed', 'refunded') DEFAULT 'submitted',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX (order_id)
);

CREATE TABLE IF NOT EXISTS limited_offers (
    offer_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    discounted_price DECIMAL(10, 2) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (product_id)
);

CREATE TABLE IF NOT EXISTS product_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    review_text TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Seeds for easier testing (why did we not do this earlier)
-- Seed products
INSERT INTO products (id, name, category, stock_quantity, price, image, description)
VALUES
('P001', 'The Ballad of Q', 'Condiment', 50, 300.00, 'ballad.jpg', 'A mysterious sauce with a bold, rich flavor.'),
('P002', 'Big Bald Bob', 'Condiment', 50, 400.00, 'bigbald.jpg', 'Intense and strong, just like Bob himself.'),
('P003', 'Call Me Debra', 'Condiment', 50, 300.00, 'callme.jpg', 'Sweet with a surprising kick.'),
('P004', 'Carbon', 'Condiment', 50, 400.00, 'carbon.jpg', 'Smoky and dark — for those who like it bold.'),
('P005', 'Catch 22', 'Condiment', 50, 300.00, 'catch.jpg', 'A twisty blend that keeps you coming back.');

-- Seed users
INSERT INTO users (username, address, contact_number, role_id, email, password_hash)
VALUES
('walter_white', '308 Negra Arroyo Lane, Albuquerque', '5051234567', 1, 'heisenberg@bb.com', '$2b$10$HeisenbergHashPlaceholder'),
('jesse_pinkman', '9809 Margo Street, Albuquerque', '5057654321', 2, 'yo@bb.com', '$2b$10$JesseHashPlaceholder'),
('saul_goodman', '1000 Legal Ave, Albuquerque', '5050000000', 2, 'bettercall@saul.com', '$2b$10$SaulHashPlaceholder'),
('skyler_white', '308 Negra Arroyo Lane, Albuquerque', '5059999999', 2, 'skyler@bb.com', '$2b$10$SkylerHashPlaceholder'),
('gus_fring', 'Los Pollos Hermanos HQ, Albuquerque', '5051112222', 1, 'gus@pollos.com', '$2b$10$GusHashPlaceholder');

-- Seed orders
INSERT INTO orders (customer_id, order_date, status, total_amount, discount_amount, notes, cancel_requested) VALUES
(1, '2025-05-01 10:00:00', 'processing', 600.00, 0.00, 'Test order #1', 0),
(2, '2025-05-02 11:30:00', 'shipped', 800.00, 5.00, 'Test order #2', 0),
(3, '2025-05-03 09:15:00', 'delivered', 900.00, 0.00, 'Test order #3', 0),
(1, '2025-05-04 14:20:00', 'processing', 1200.00, 0.00, 'Test order #4', 0),
(2, '2025-05-05 16:45:00', 'shipped', 900.00, 0.00, 'Test order #5', 0),
(3, '2025-05-06 08:00:00', 'delivered', 1500.00, 0.00, 'Test order #6', 0),
(1, '2025-05-07 13:10:00', 'processing', 700.00, 0.00, 'Test order #7', 0),
(2, '2025-05-08 15:30:00', 'shipped', 600.00, 0.00, 'Test order #8', 0),
(3, '2025-05-09 17:40:00', 'delivered', 1000.00, 0.00, 'Test order #9', 0),
(1, '2025-05-10 12:05:00', 'processing', 300.00, 0.00, 'Test order #10', 0);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(1, 'P001', 2, 300.00, 600.00),
(2, 'P002', 2, 400.00, 800.00),
(3, 'P003', 3, 300.00, 900.00),
(4, 'P004', 3, 400.00, 1200.00),
(5, 'P005', 3, 300.00, 900.00),
(6, 'P001', 5, 300.00, 1500.00),
(7, 'P004', 1, 400.00, 400.00),
(7, 'P005', 1, 300.00, 300.00),
(8, 'P003', 2, 300.00, 600.00),
(9, 'P002', 2, 400.00, 800.00),
(9, 'P005', 1, 300.00, 300.00),
(10, 'P001', 1, 300.00, 300.00);
