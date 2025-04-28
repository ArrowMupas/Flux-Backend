const asyncHandler = require('express-async-handler');
const userModel = require('../models/userModel');
const sendResponse = require('../middlewares/responseMiddleware');
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
    const userExists = await userModel.getUserByUsername(username);
    if (userExists) {
        console.error('User already exists:', email);
        res.status(400);
        throw new Error('User already exists');
    }

    // Username format validation
    const usernameRegex = /^[a-zA-Z][A-Za-z0-9-_]{8,15}$/;
    if (!usernameRegex.test(username)) {
        res.status(400);
        throw new Error(
            'Password must be at least 8 characters long and include at least one number'
        );
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
        res.status(400);
        throw new Error(
            'Password must be at least 8 characters long and include at least one number'
        );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400);
        throw new Error(
            'Password must be at least 8 characters long and include at least one number'
        );
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
    const { username, password } = req.body;

    const user = await userModel.getUserByUsername(username);

    // Check for existing user
    if (!user) {
        res.status(400);
        throw new Error('No such user');
    }

    // Check if user is active
    if (!user.is_active) {
        res.status(403);
        throw new Error('Account is inactive');
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

// Reset user password
const resetUserPassword = asyncHandler(async (req, res) => {
    const { username, password, newPassword, confirmPassword } = req.body;

    const user = await userModel.getUserByUsername(username);
    // Check for existing user
    if (!user) {
        res.status(400);
        throw new Error('No such user');
    }

    // Check if user is active
    if (!user.is_active) {
        res.status(403);
        throw new Error('Account is inactive');
    }

    // Bcrypt authentication
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
        res.status(400);
        throw new Error('New password must be different from the old password');
    }

    // Check if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('New passwords do not match');
    }

    // Password strength validation (at least 8 characters, 1 number, 1 special character)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        res.status(400);
        throw new Error(
            'Password must be at least 8 characters long and include at least one number'
        );
    }

    // Create user with hashed password
    const hashedPassword = await bcrypt.hash(newPassword, 10); // Combines password with salt
    userModel.resetUserPassword(user.id, hashedPassword);

    res.status(200).json({
        message: 'Password reset successful',
    });
});

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUser,
    resetUserPassword,
};
