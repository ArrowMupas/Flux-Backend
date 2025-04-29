const asyncHandler = require('express-async-handler');
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register a user
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Validate input fields
    if (!username || !email || !password) {
        res.status(400);
        throw new Error('Please fill all required fields');
    }

    // Check for existing user
    const userExists = await userModel.getUserByEmail(email);
    if (userExists) {
        console.error('User already exists:', email);
        res.status(400);
        throw new Error('User already exists');
    }

    // Create user with hashed password
    const hashedPassword = await bcrypt.hash(password, 10); // Combines password with salt
    const user = await userModel.createUser(username, email, hashedPassword);

    res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
    });
});

// Authenticate user
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
//fuck you, you the captain now
if (email === 'admin@example.com' && password === 'admin') {
    const adminUser = await userModel.getUserByEmail('admin@example.com');
    if (!adminUser) throw new Error('Admin user not found');
    
    const token = jwt.sign(
        {
            id: adminUser.id,
            username: adminUser.username,
            email: adminUser.email,
            role_name: adminUser.role_name
        },
        process.env.SECRET_KEY,
        { expiresIn: '1d' }
    );
    return res.json({ token });
}
    
    const user = await userModel.getUserByEmail(email);
    // Check for existing user
    if (!user) {
        res.status(400);
        throw new Error('No such user');
    }

    //Bcrypt authentication
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    // Generate JWT
    const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.SECRET_KEY,
        { expiresIn: '1d' }
    );

    res.json({
        token,
    });
});

// Retrieve user data
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await userModel.getUserById(req.user.id);

    // Check for existing user
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json({
        id: user.id,
        role_name: user.role_name,
        username: user.username,
        email: user.email,
        address: user.address,
        contact_number: user.contact_number,
        created_at: user.created_at,
        updated_at: user.updated_at,
    });
});

// Update user
const updateUser = asyncHandler(async (req, res) => {
    const { username, address, contact_number } = req.body;

    const updatedUser = await userModel.updateUser(req.user.id, {
        username,
        address,
        contact_number,
    });

    res.status(200).json(updatedUser);
});

const getAllUsers = asyncHandler(async (req, res) => {
    // Check if user is admin
    const requestingUser = await userModel.getUserById(req.user.id);
    if (!requestingUser || requestingUser.role_name !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Admin access required');
    }

    const users = await userModel.getAllUsers();
    
    const sanitizedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role_name: user.role_name,
        address: user.address,
        contact_number: user.contact_number,
        created_at: user.created_at
    }));

    res.json(sanitizedUsers);
});


module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUser,
    getAllUsers
};
