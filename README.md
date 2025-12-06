# Backend Foundation ~ Done! (Passed with minor revisions!, Best Thesis on the exhibit!)

This is a foundational backend setup for our college thesis.
It’s finished and done now and may stay this way going forward as it is now a memory.
Will still probably edit some documentation or maybe not.
Back then I really hoped to keep coding this even after the thesis has ended.
Right now I just want the knowledge and move on as I just can't go back to this anymore.
I still wanted to do a lot of things frontend and backend but I wanna close this chapter now.
Maybe the changes for the better will go to my next projects instead.
I loved this codebase no matter how bad it was.

## 🛠 Technologies Used/ You can use

-   **Node.js** – JavaScript runtime environment
-   **Git** – Version control
-   **Insomnia** – API testing
-   **Visual Studio Code** – Code editor
-   **MySQL2** – Database driver for MySQL

## There really is more things we used than this but I want to finalized this so maybe I will add them to the wiki.

## 🚀 Installation

Follow the steps below to set up the project locally:

Create a folder, open it in VS code, open terminal and run this.

```bash

git clone https://github.com/ArrowMupas/Flux-Backend.git .

npm install

npm run dev

```

---

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

## 3. Create a .env

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

---

## 4. One-Time Database Initialization

To make setup easier, this project includes an **initDB script** that will automatically create the required database and tables by running the SQL commands in `init.sql`.

### 🔄 Steps to Run It

1. Make sure your **MySQL server is running**
2. Run the init script on terminal in VS code

```bash

node database/initDB.js

```

---

## Dropping a database

```bash

node database/dropDB.js

```

---

## 🚀 Git Commands (Quick Reference)

```bash
# Create a new branch
git checkout -b your-branch-name

# Switch to an existing branch
git checkout your-branch-name

# Switch back to main branch
git checkout main

# Stage all changes
git add .

# Commit changes with a message
git commit -m "your message here"

# Push your branch to GitHub
git push origin your-branch-name

# List all local branches
git branch

# List remote branches
git branch -r

# pull latest main
git pull origin main

# fetch
git fetch
```

---
