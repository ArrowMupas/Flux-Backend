CREATE DATABASE IF NOT EXISTS sauce;
USE sauce;

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    stock_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
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

INSERT IGNORE INTO roles (name, description) VALUES
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

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS staff_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT IGNORE INTO staff_permissions (name) VALUES
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

CREATE TABLE IF NOT EXISTS coupons (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  code            VARCHAR(50) UNIQUE NOT NULL,
  description     TEXT,
  discount_type   ENUM('fixed', 'percentage') NOT NULL,
  discount_value  DECIMAL(10, 2) NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  starts_at       DATETIME NULL,
  expires_at      DATETIME NULL,
  usage_limit     INT NULL, -- total allowed uses
  per_user_limit  INT NULL, -- allowed uses per user
  times_used      INT DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS coupon_usages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  coupon_code VARCHAR(50) NOT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (coupon_code) REFERENCES coupons(code),
  
  INDEX (user_id),
  INDEX (coupon_code)
);

CREATE TABLE IF NOT EXISTS carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    coupon_code VARCHAR(50) NULL,
    discount_total DECIMAL(10, 2) DEFAULT 0,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT unique_cart_product UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded', 'returned') NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    address TEXT,
    cancel_requested BOOLEAN DEFAULT FALSE,
    coupon_code VARCHAR(50) NULL,
    subtotal DECIMAL(10, 2) NOT NULL,

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

CREATE TABLE IF NOT EXISTS product_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    order_id VARCHAR(50) NULL,
    review_text TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    UNIQUE KEY unique_user_product_review (user_id, product_id)
);

-- Seeds for easier testing (why did we not do this earlier)
-- Seed products
INSERT IGNORE INTO products (id, name, category, stock_quantity, price, image, description, created_at)
VALUES
('P001', 'The Ballad of Q', 'Condiment', 50, 300.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302194/alas_uploads/iknwr95caffzjwbkkhdu.jpg', 'A mysterious sauce with a bold, rich flavor.', '2025-05-30 09:14:12'),
('P002', 'Big Bald Bob', 'Condiment', 50, 400.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302182/alas_uploads/bbounuzrfo02cbronbme.jpg', 'Intense and strong, just like Bob himself.', '2025-05-30 09:14:12'),
('P003', 'Call Me Debra', 'Condiment', 50, 300.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302419/alas_uploads/ffgfhv57rvygxjkriw9e.jpg', 'Sweet with a surprising kick.', '2025-05-30 09:14:12'),
('P004', 'Carbon', 'Condiment', 50, 400.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302380/alas_uploads/gpdvbwvqnx1l2ri4fbx9.jpg', 'Smoky and dark — for those who like it bold.', '2025-05-30 09:14:12'),
('P005', 'Catch 22', 'Condiment', 50, 300.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749303226/alas_uploads/n2yltnqql5zvciosdugo.jpg', 'A twisty blend that keeps you coming back.', '2025-05-30 09:14:12');

INSERT IGNORE INTO products (id, name, category, stock_quantity, price, image, description)
VALUES
('P006', 'Gypsy Bu', 'Condiment', 40, 999.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302550/alas_uploads/zgb62etqzs0pmyohucar.jpg', 'Rises in heat and flavor.'),
('P007', 'Grin', 'Condiment', 30, 300.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302469/alas_uploads/y3alljz8lpsne23jbdm2.jpg', 'Hits quietly, leaves a lasting impression.'),
('P008', 'Birds Eye Gambit', 'Condiment', 30, 300.00, 'https://res.cloudinary.com/drq2wzvmo/image/upload/v1749302297/alas_uploads/gzl6lzcevjp8uhyza6h8.jpg', 'Hits quietly, leaves a lasting impression.');

-- Seed users
INSERT IGNORE INTO users (username, address, contact_number, role_id, email, password_hash, created_at, updated_at)
VALUES
('walter_white', '308 Negra Arroyo Lane, Albuquerque', '5051234567', 1, 'heisenberg@bb.com', '$2b$10$HeisenbergHashPlaceholder', '2025-05-30 09:14:12', '2025-05-30 09:14:12'),
('jesse_pinkman', '9809 Margo Street, Albuquerque', '5057654321', 2, 'yo@bb.com', '$2b$10$JesseHashPlaceholder', '2025-05-30 09:14:12', '2025-05-30 09:14:12'),
('saul_goodman', '1000 Legal Ave, Albuquerque', '5050000000', 2, 'bettercall@saul.com', '$2b$10$SaulHashPlaceholder', '2025-05-30 09:14:12', '2025-05-30 09:14:12'),
('skyler_white', '308 Negra Arroyo Lane, Albuquerque', '5059999999', 2, 'skyler@bb.com', '$2b$10$SkylerHashPlaceholder', '2025-05-30 09:14:12', '2025-05-30 09:14:12'),
('gus_fring', 'Los Pollos Hermanos HQ, Albuquerque', '5051112222', 1, 'gus@pollos.com', '$2b$10$GusHashPlaceholder', '2025-05-30 09:14:12', '2025-05-30 09:14:12');

-- Seed orders
INSERT IGNORE INTO orders (
  id,
  customer_id,
  order_date,
  status,
  total_amount,
  discount_amount,
  notes,
  cancel_requested,
  coupon_code,
  subtotal
) VALUES
('ALAS202505010001', 1, '2025-05-01 10:00:00', 'processing', 600.00, 0.00, 'Test order #1', 0, NULL, 600.00),
('ALAS202505020002', 2, '2025-05-02 11:30:00', 'shipping', 800.00, 0.00, 'Test order #2', 0, NULL, 800.00),
('ALAS202505030003', 3, '2025-05-03 09:15:00', 'delivered', 900.00, 0.00, 'Test order #3', 0, NULL, 900.00),
('ALAS202505040004', 1, '2025-05-04 14:20:00', 'processing', 1200.00, 0.00, 'Test order #4', 0, NULL, 1200.00),
('ALAS202505050005', 2, '2025-05-05 16:45:00', 'shipping', 900.00, 0.00, 'Test order #5', 0, NULL, 900.00),
('ALAS202505060006', 3, '2025-05-06 08:00:00', 'delivered', 1500.00, 0.00, 'Test order #6', 0, NULL, 1500.00),
('ALAS202505070007', 1, '2025-05-07 13:10:00', 'processing', 700.00, 0.00, 'Test order #7', 0, NULL, 700.00),
('ALAS202505080008', 2, '2025-05-08 15:30:00', 'shipping', 600.00, 0.00, 'Test order #8', 0, NULL, 600.00),
('ALAS202505090009', 3, '2025-05-09 17:40:00', 'delivered', 1000.00, 0.00, 'Test order #9', 0, NULL, 1000.00),
('ALAS202505100010', 1, '2025-05-10 12:05:00', 'processing', 300.00, 0.00, 'Test order #10', 0, NULL, 300.00);


INSERT IGNORE INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
('ALAS202505010001', 'P001', 2, 300.00, 600.00),
('ALAS202505020002', 'P002', 2, 400.00, 800.00),
('ALAS202505020002', 'P005', 2, 400.00, 800.00),
('ALAS202505030003', 'P003', 2, 400.00, 800.00),
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

CREATE TABLE IF NOT EXISTS inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(50) NULL,
    user_id INT NULL,
    admin_id INT NULL,
    action ENUM('add_stock', 'reserve', 'confirm', 'cancel_reserve') NOT NULL,
    change_available INT NOT NULL,
    change_reserved INT NOT NULL,
    old_available INT NOT NULL,
    old_reserved INT NOT NULL,
    new_available INT NOT NULL,
    new_reserved INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,

    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_inventory_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_inventory_admin FOREIGN KEY (admin_id) REFERENCES users(id),
    CONSTRAINT fk_inventory_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS inventory_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('LOW_STOCK', 'CRITICAL_STOCK', 'OUT_OF_STOCK', 'BUNDLE_LOW_STOCK', 'BUNDLE_UNAVAILABLE') NOT NULL,
    entity_type ENUM('product', 'bundle') NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('active', 'acknowledged', 'resolved') DEFAULT 'active',
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL,
    acknowledged_by INT NULL,
    resolved_at TIMESTAMP NULL,
    resolved_by INT NULL,
    
    priority_order INT GENERATED ALWAYS AS (
        CASE priority 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END
    ) STORED,
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    INDEX idx_priority_status (priority_order, status),
    
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);
