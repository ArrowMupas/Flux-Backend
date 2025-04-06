# Backend Foundation ~ In Progress

This is a foundational backend setup. It’s currently a work in progress, focusing on basic CRUD operations.

## ✨ Features

- **GET** product
- **POST** product
- **UPDATE** product
- **DELETE** product

## 🛠 Technologies Used/ You can use

- **Node.js** – JavaScript runtime environment
- **Git** – Version control
- **Insomnia** – API testing
- **Visual Studio Code** – Code editor
- **MySQL2** – Database driver for MySQL

---

## 🚀 Installation

Follow the steps below to set up the project locally:

Create a folder, open it in VS code, open terminal and run this.

```bash

git clone https://github.com/ArrowMupas/TRY-NPM.git .

npm install

npm run dev

```

## 🧰 How to Set Up MySQL on Your Computer

If you're new to MySQL, follow these steps to install it and make it work with this project.

### 1. ✅ Download MySQL

Go to the official MySQL website and download the installer:

🔗 [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)

Choose the version for your operating system (Windows, macOS, Linux) and install it.

---

### 2. 🔑 Set a Root Password

During installation, it will ask you to **set a root password**.  
Make sure to **remember this password** — you’ll need it to connect your backend to the database.

---

## 3. One-Time Database Initialization

To make setup easier, this project includes an **initDB script** that will automatically create the required database and tables by running the SQL commands in `init.sql`.

### 🔄 Steps to Run It

1. Make sure your **MySQL server is running**
2. Run the init script

```bash

node initDB.js

```
---

## 4. Create a .env

The `.env` file contains your environment variables, including database credentials and other configuration settings. Follow the steps below to create and configure your `.env` file.

### 1. Create the `.env` File

In the root of your project folder, create a file named `.env`.

### 2. Set Your MySQL Database Credentials

Open the `.env` file and add the following database configuration:

```env

# MySQL Database Credentials

DB_HOST=localhost  # Database host
DB_USER=user       # Database user you setup
DB_PASS=pass       # Database password you setup
DB_NAME=sauce      # Database name
DB_PORT=3306       # Database port you setup

# Server Port
PORT=3000         # Port

NODE_ENV=development
FRONTEND=http://localhost:5173 # The sample frontend I used, you can just ignore this

```

_More features and documentation coming soon._
