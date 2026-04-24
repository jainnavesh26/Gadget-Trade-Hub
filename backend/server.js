require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import Models
const User = require('./models/User');
const Order = require('./models/Order');
const TradeIn = require('./models/TradeIn');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-gadget-trade-hub-key';

// Middleware setup
app.use(cors());
app.use(express.json());

// Serve static frontend files (All your HTML/CSS/JS files inside the frontend/ folder)
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB Connection string setup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gadget-trade-hub';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connection successful'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access Denied: No Token Provided!' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Access Denied: Invalid Token!' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Access Denied: Admins Only!' });
    }
    next();
};

// --- API Routes ---

// 1. User Registration Route
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email.' });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully', user: { name, email } });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 2. User Login Route
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid Email or Password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid Email or Password' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ message: 'Login successful', token, user: { name: user.name, email: user.email, isAdmin: user.isAdmin } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Submit Order Route (Checkout)
app.post('/api/orders', async (req, res) => {
    try {
        const { customerDetails, items, totalPrice, paymentMethod } = req.body;

        const newOrder = new Order({
            customerDetails,
            items,
            totalPrice,
            paymentMethod
        });

        await newOrder.save();
        res.status(201).json({ message: 'Order placed successfully', orderId: newOrder._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 4. Submit Trade-In Request Route
app.post('/api/trade-in', async (req, res) => {
    try {
        const { brand, model, scratches } = req.body;

        const newTradeIn = new TradeIn({
            brand,
            model,
            scratches
        });

        await newTradeIn.save();
        res.status(201).json({ message: 'Trade-in evaluated successfully', evaluationId: newTradeIn._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 5. Admin Protected Routes
app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/trade-ins', authenticateToken, isAdmin, async (req, res) => {
    try {
        const tradeIns = await TradeIn.find().sort({ createdAt: -1 });
        res.json(tradeIns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dummy endpoint for Phones if missing actual DB integration for store.html
app.get('/api/phones', async (req, res) => {
    res.json([
        { _id: '1', brand: 'Apple', name: 'iPhone 13', storage: '128GB', price: 42999, condition: 'Like New', imageUrl: 'https://via.placeholder.com/150x200/1e293b/f8fafc?text=iPhone+13' },
        { _id: '2', brand: 'Samsung', name: 'Galaxy S22', storage: '256GB', price: 38500, condition: 'Good', imageUrl: 'https://via.placeholder.com/150x200/1e293b/f8fafc?text=Galaxy+S22' },
        { _id: '3', brand: 'Google', name: 'Pixel 7', storage: '128GB', price: 45000, condition: 'Like New', imageUrl: 'https://via.placeholder.com/150x200/1e293b/f8fafc?text=Pixel+7' }
    ]);
});

// Catch-all route to send index.html from frontend folder for unknown routes 
app.get(/^.*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
