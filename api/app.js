const express = require('express');
const cookieParser = require('cookie-parser'); // ضروري باش يقرأ cookies ديال refresh token
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// 1. Middlewares لقراءة JSON و Cookies
app.use(express.json());
app.use(cookieParser());
app.use(cors({
	credentials: true,
	origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

// 2. Register Auth Routes
app.use('/api/auth', authRoutes);

module.exports = app;