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
    is_verified BOOLEAN DEFAULT FALSE,
    contact_number VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(255) NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staff_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO staff_permissions (name) VALUES
('get_sales_summary'),
('get_top_products'),
('get_daily_sales'),
('get_user_report');

CREATE TABLE IF NOT EXISTS user_permissions (
    user_id INT,
    permission_id INT,
    PRIMARY KEY (user_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES staff_permissions(id) ON DELETE CASCADE
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
    id VARCHAR(50) PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded', 'returned') NOT NULL DEFAULT 'pending',
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
    order_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX (order_id),
    INDEX (product_id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    status ENUM('pending', 'processing', 'shipping', 'delivered', 'cancelled', 'cancel_requested', 'refunded', 'returned') NOT NULL,
    status_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX (order_id),
    INDEX (status_date)
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    method ENUM('GCash', 'Maya', 'bank_transfer') NOT NULL,
    reference_number VARCHAR(100) NOT NULL,
    account_name VARCHAR(100),
    address  VARCHAR(255),  
    status ENUM('submitted', 'verified', 'failed', 'refunded') DEFAULT 'submitted',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX (order_id)
);

CREATE TABLE IF NOT EXISTS product_reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id VARCHAR(50),
    order_id VARCHAR(50),
    quantity INT,
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS after_sales_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('refund', 'return') NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    user_id INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('requested', 'pending', 'completed') DEFAULT 'requested',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS walk_in_sales (
    id VARCHAR(50) PRIMARY KEY,
    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_name VARCHAR(255), 
    customer_email VARCHAR(255), 
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    INDEX (sale_date)
);

CREATE TABLE IF NOT EXISTS walk_in_sale_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES walk_in_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id), 
    INDEX (sale_id),
    INDEX (product_id)
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
INSERT INTO products (id, name, category, stock_quantity, price, image, description, created_at)
VALUES
('P001', 'The Ballad of Q', 'Condiment', 50, 300.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302194/alas_uploads/iknwr95caffzjwbkkhdu.jpg', 'A mysterious sauce with a bold, rich flavor.', '2025-05-30 09:14:12'),
('P002', 'Big Bald Bob', 'Condiment', 50, 400.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302182/alas_uploads/bbounuzrfo02cbronbme.jpg', 'Intense and strong, just like Bob himself.', '2025-05-30 09:14:12'),
('P003', 'Call Me Debra', 'Condiment', 50, 300.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302419/alas_uploads/ffgfhv57rvygxjkriw9e.jpg', 'Sweet with a surprising kick.', '2025-05-30 09:14:12'),
('P004', 'Carbon', 'Condiment', 50, 400.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302380/alas_uploads/gpdvbwvqnx1l2ri4fbx9.jpg', 'Smoky and dark — for those who like it bold.', '2025-05-30 09:14:12'),
('P005', 'Catch 22', 'Condiment', 50, 300.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749303226/alas_uploads/n2yltnqql5zvciosdugo.jpg', 'A twisty blend that keeps you coming back.', '2025-05-30 09:14:12');

INSERT INTO products (id, name, category, stock_quantity, price, image, description)
VALUES
('P006', 'Gypsy Bu', 'Condiment', 40, 999.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302550/alas_uploads/zgb62etqzs0pmyohucar.jpg', 'Rises in heat and flavor.'),
('P007', 'Grin', 'Condiment', 30, 300.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302469/alas_uploads/y3alljz8lpsne23jbdm2.jpg', 'Hits quietly, leaves a lasting impression.'),
('P008', 'Birds Eye Gambit', 'Condiment', 30, 300.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302297/alas_uploads/gzl6lzcevjp8uhyza6h8.jpg', 'Hits quietly, leaves a lasting impression.');

-- Seed users
INSERT INTO users (username, address, contact_number, role_id, email, password_hash, created_at, updated_at)
VALUES
('walter_white', '308 Negra Arroyo Lane, Albuquerque', '5051234567', 1, 'heisenberg@bb.com', '$2b$10$HeisenbergHashPlaceholder', '2025-05-30 09:14:12', '2025-05-30 09:14:12'),
('jesse_pinkman', '9809 Margo Street, Albuquerque', '5057654321', 2, 'yo@bb.com', '$2b$10$JesseHashPlaceholder', '2025-05-30 09:14:12', '2025-05-30 09:14:12'),
('saul_goodman', '1000 Legal Ave, Albuquerque', '5050000000', 2, 'bettercall@saul.com', '$2b$10$SaulHashPlaceholder', '2025-05-30 09:14:12', '2025-05-30 09:14:12'),
('skyler_white', '308 Negra Arroyo Lane, Albuquerque', '5059999999', 2, 'skyler@bb.com', '$2b$10$SkylerHashPlaceholder', '2025-05-30 09:14:12', '2025-05-30 09:14:12'),
('gus_fring', 'Los Pollos Hermanos HQ, Albuquerque', '5051112222', 1, 'gus@pollos.com', '$2b$10$GusHashPlaceholder', '2025-05-30 09:14:12', '2025-05-30 09:14:12');

-- Seed orders
INSERT INTO orders (id, customer_id, order_date, status, total_amount, discount_amount, notes, cancel_requested) VALUES
('ALAS202505010001', 1, '2025-05-01 10:00:00', 'processing', 600.00, 0.00, 'Test order #1', 0),
('ALAS202505020002', 2, '2025-05-02 11:30:00', 'shipping', 800.00, 5.00, 'Test order #2', 0),
('ALAS202505030003', 3, '2025-05-03 09:15:00', 'delivered', 900.00, 0.00, 'Test order #3', 0),
('ALAS202505040004', 1, '2025-05-04 14:20:00', 'processing', 1200.00, 0.00, 'Test order #4', 0),
('ALAS202505050005', 2, '2025-05-05 16:45:00', 'shipping', 900.00, 0.00, 'Test order #5', 0),
('ALAS202505060006', 3, '2025-05-06 08:00:00', 'delivered', 1500.00, 0.00, 'Test order #6', 0),
('ALAS202505070007', 1, '2025-05-07 13:10:00', 'processing', 700.00, 0.00, 'Test order #7', 0),
('ALAS202505080008', 2, '2025-05-08 15:30:00', 'shipping', 600.00, 0.00, 'Test order #8', 0),
('ALAS202505090009', 3, '2025-05-09 17:40:00', 'delivered', 1000.00, 0.00, 'Test order #9', 0),
('ALAS202505100010', 1, '2025-05-10 12:05:00', 'processing', 300.00, 0.00, 'Test order #10', 0);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
('ALAS202505010001', 'P001', 2, 300.00, 600.00),
('ALAS202505020002', 'P002', 2, 400.00, 800.00),
('ALAS202505020002', 'P005', 2, 400.00, 800.00),
('ALAS202505020003', 'P003', 2, 400.00, 800.00),
('ALAS202505030003', 'P003', 3, 300.00, 900.00),
('ALAS202505040004', 'P004', 3, 400.00, 1200.00),
('ALAS202505050005', 'P005', 3, 300.00, 900.00),
('ALAS202505060006', 'P001', 5, 300.00, 1500.00),
('ALAS202505070007', 'P004', 1, 400.00, 400.00),
('ALAS202505070007', 'P005', 1, 300.00, 300.00),
('ALAS202505080008', 'P003', 2, 300.00, 600.00),
('ALAS202505090009', 'P002', 2, 400.00, 800.00),
('ALAS202505090009', 'P005', 1, 300.00, 300.00),
('ALAS202505100010', 'P001', 1, 300.00, 300.00);

CREATE TABLE IF NOT EXISTS special_offers (
    offer_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    rule_type ENUM('B1G1', 'FIXED') NOT NULL,
    x_quantity INT NOT NULL,
    y_quantity INT DEFAULT 0,
    fixed_price DECIMAL(10,2) DEFAULT NULL,
    start_date DATETIME,
    end_date DATETIME,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS coupons (
    coupon_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    type ENUM('PERCENTAGE', 'FIXED', 'SPECIAL') NOT NULL,
    amount DECIMAL(10,2) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATETIME,
    end_date DATETIME
);

CREATE TABLE IF NOT EXISTS coupon_usage (
    usage_id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT,
    user_id INT,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS bundles (
    bundle_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bundle_items (
    bundle_item_id INT AUTO_INCREMENT PRIMARY KEY,
    bundle_id INT NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (bundle_id) REFERENCES bundles(bundle_id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'promo', 'alert') DEFAULT 'info',
  is_global BOOLEAN DEFAULT TRUE, 
  user_id INT DEFAULT NULL,       
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
