const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createDefaultActivities } = require('../services/defaultActivityService');

// ==========================================
// LOGIN CONTROLLER
// ==========================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email (جلب كلمة السر مع المستخدم)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'البريد الإلكتروني أو كلمة السر غير صحيحة' });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'البريد الإلكتروني أو كلمة السر غير صحيحة' });
    }

    // 3. Direct JWT Sign using environment variables
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    );

    // 4. Save Refresh Token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // 5. Set Refresh Token in Cookie (Configured for Local Development)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // kodo local (HTTP عادي) 
      sameSite: 'lax', // للعمل بين Ports مختلفين
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 6. Send Response
    return res.status(200).json({
      message: 'تم تسجيل الدخول بنجاح',
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        sex: user.sex,
        isPeriodMode: user.isPeriodMode
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
};

// ==========================================
// REGISTER CONTROLLER 
// ==========================================
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, sex, country, city } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create User in DB
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      sex,
      country: country || 'Morocco',
      city: city || 'Nador',
      isPeriodMode: false,
      refreshToken: null
    });

    // 4. Direct JWT Sign using environment variables
    const accessToken = jwt.sign(
      { userId: newUser._id }, 
      process.env.ACCESS_TOKEN_SECRET, 
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: newUser._id }, 
      process.env.REFRESH_TOKEN_SECRET, 
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    );

    // 5. Save Refresh Token in DB
    newUser.refreshToken = refreshToken;
    await newUser.save();

    // 6. Create Default Activities (آمن ضد التكرار)
    await createDefaultActivities(newUser._id);
    newUser.onboardingCompleted = true;

    // 7. Set Refresh Token in Cookie (Configured for Local Development)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // kodo local (HTTP عادي)
      sameSite: 'lax', // للعمل بين Ports مختلفين
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 8. Send Response
    return res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح',
      accessToken,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        sex: newUser.sex,
        isPeriodMode: newUser.isPeriodMode,
        onboardingCompleted: newUser.onboardingCompleted
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
};

module.exports = {
  register,
  login
};