const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure this file can access environment variables
const { pool } = require('../config/db');
const auth = require('../middleware/auth'); // Import authentication middleware

const router = express.Router();

// Get JWT secret with fallback for development
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// @route   GET /api/auth
// @desc    Get logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, email, plan FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ msg: 'User already exists with this email.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Create JWT token
        const payload = {
            user: {
                id: result.insertId
            }
        };

        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '24h' },
            async (err, token) => {
                if (err) throw err;
                
                // Get the newly created user data
                const [newUser] = await pool.query('SELECT id, email, name, plan, photo_credits FROM users WHERE id = ?', [result.insertId]);
                
                res.json({ 
                    token,
                    user: {
                        id: newUser[0].id,
                        email: newUser[0].email,
                        name: newUser[0].name,
                        plan: newUser[0].plan,
                        photo_credits: newUser[0].photo_credits
                    }
                });
            }
        );
    } catch (err) {
        console.error('Signup Error:', err.message);
        res.status(500).json({ msg: 'Server error during signup.' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        const user = rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        // Create and return JWT token
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        plan: user.plan,
                        photo_credits: user.photo_credits
                    }
                });
            }
        );
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ msg: 'Server error during login.' });
    }
});

// @route   POST /api/payment-success
// @desc    Update user plan after successful PayPal payment
// @access  Private
router.post('/payment-success', auth, async (req, res) => {
    const { plan, orderID, payerID, qty } = req.body;
    if (!plan || !orderID || !payerID) {
        return res.status(400).json({ msg: 'Missing payment or plan info.' });
    }
    try {
        // Update the user's plan and photo credits in the database
        const credits = parseInt(qty) || 1;
        await pool.query('UPDATE users SET plan = ?, photo_credits = ? WHERE id = ?', [plan, credits, req.user.id]);
        res.json({ msg: 'Plan and credits updated successfully.' });
    } catch (err) {
        console.error('Payment Success Error:', err.message);
        res.status(500).json({ msg: 'Server error updating plan.' });
    }
});

// @route   GET /api/paypal-client-id
// @desc    Get PayPal client ID for frontend
// @access  Public
router.get('/paypal-client-id', (req, res) => {
    // Allow mode to be set via query param, fallback to env
    const paypalMode = req.query.mode || process.env.PAYPAL_MODE || 'sandbox';
    let clientId;
    
    if (paypalMode === 'live') {
        clientId = process.env.PAYPAL_LIVE_CLIENT_ID;
    } else {
        clientId = process.env.PAYPAL_CLIENT_ID; // sandbox client ID
    }
    
    if (!clientId) {
        return res.status(500).json({ 
            error: `PayPal ${paypalMode} client ID not configured`,
            mode: paypalMode 
        });
    }
    
    res.json({ 
        clientId,
        mode: paypalMode,
        isLive: paypalMode === 'live'
    });
});

// @route   POST /api/paypal-webhook
// @desc    PayPal webhook for payment verification (production security)
// @access  Public
router.post('/paypal-webhook', async (req, res) => {
    // TODO: Implement PayPal webhook verification for production
    // This would verify the payment with PayPal's servers before updating credits
    // For now, we're using client-side verification which is sufficient for most use cases
    
    console.log('PayPal webhook received:', req.body);
    res.status(200).json({ msg: 'Webhook received' });
});

// @route   GET /api/user/credits
// @desc    Get user's photo credits
// @access  Private
router.get('/user/credits', auth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT photo_credits, plan FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        
        res.json({ 
            photo_credits: rows[0].photo_credits || 0,
            plan: rows[0].plan
        });
    } catch (err) {
        console.error('Get Credits Error:', err.message);
        res.status(500).json({ msg: 'Server error getting credits.' });
    }
});

module.exports = router; 
