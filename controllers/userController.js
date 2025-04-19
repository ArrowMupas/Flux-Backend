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

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUser,
};
