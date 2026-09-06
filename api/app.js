const express = require('express');
const cookieParser = require('cookie-parser'); // ضروري باش يقرأ cookies ديال refresh token
const authRoutes = require('./routes/authRoutes');

const app = express();

// 1. Middlewares لقراءة JSON و Cookies
app.use(express.json());
app.use(cookieParser());

// 2. Register Auth Routes
app.use('/api/v1/auth', authRoutes);

module.exports = app;