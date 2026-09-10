const express = require('express');
const cookieParser = require('cookie-parser'); // ضروري باش يقرأ cookies ديال refresh token
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const activityRoutes = require('./src/routes/activityRoutes');
const programmeDayRoutes = require('./src/routes/programmeDayRoutes');
const sleepRoutes = require('./src/routes/sleepRoutes');
const programmeValidationRoutes = require('./src/routes/programmeValidationRoutes');

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

// 3. Register Profile Routes
app.use('/api/profile', profileRoutes);

// 4. Register Activity Routes
app.use('/api/activities', activityRoutes);

// 5. Register Programme Day Routes
app.use('/api/programme-day', programmeDayRoutes);

// 6. Register Sleep Routes
app.use('/api/sleep', sleepRoutes);

// 7. Register Programme Validation Routes
app.use('/api/programme-validation', programmeValidationRoutes);

module.exports = app;