const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { testConnection } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Photo-Restore-Pro' });
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/', require('./routes/ml_upload'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    testConnection();
}); 