const asyncHandler = require("express-async-handler");
const userModel = require("../models/userModel");

const registerUser = asyncHandler(async (req, res) => {
    // 1. Log the complete incoming request
    console.log('Incoming request body:', JSON.stringify(req.body, null, 2));
    
    const { username, email, password } = req.body;

    // 2. Log validation checks
    console.log('Validating fields - userame:', username, 'email:', email, 'password:', !!password);
    
    if (!username || !email || !password) {
        console.error('Missing required fields');
        res.status(400);
        throw new Error("Please fill all required fields");
    }

    // 3. Log before database check
    console.log('Checking if user exists:', email);
    const userExists = await userModel.getUserByEmail(email);
    
    if (userExists) {
        console.error('User already exists:', email);
        res.status(400);
        throw new Error("User already exists");
    }

    // 4. Log before user creation
    console.log('Creating user with:', { username, email });
    
    const user = await userModel.createUser(username, email, password);
    
    // 5. Log creation result
    console.log('User created successfully:', JSON.stringify(user, null, 2));
    
    res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email
    });
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password} = req.body;
    const user = await userModel.getUserByEmail(email);

    if (user && password === user.password) { // Simple password comparison
        res.json({
            id: user.id,
            name: user.userName,
            email: user.email
        });
    } else {
        res.status(401);
        throw new Error("Invalid credentials");
    }
});

const getUserProfile = asyncHandler(async (req, res) => {
    const user = await userModel.getUserById(req.params.id);
    
    if (user) {
        res.json({
            name: user.name,
            email: user.email,
            address: user.address,
            contact_number: user.contact_number
        });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});

const updateUser = asyncHandler(async (req, res) => {
    const { username, address, contact_number } = req.body;
    const userId = req.params.id;

    const updatedUser = await userModel.updateUser(
        userId,
        { username, address, contact_number }
    );

    res.status(200).json(updatedUser);
});

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUser
};