const User = require('../models/user');
const bcrypt = require('bcryptjs');

// ==========================================
// GET ME CONTROLLER (جلب بيانات المستخدم الحالي)
// ==========================================
const getMe = async (req, res) => {
  try {
    // 1. ابحث عن المستخدم بواسطة userId اللي جا من الـ token
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // 2. Send Response
    return res.status(200).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        sex: user.sex,
        country: user.country,
        city: user.city,
        isPeriodMode: user.isPeriodMode,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
};

// ==========================================
// UPDATE PROFILE CONTROLLER (تحديث البيانات)
// ==========================================
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, city, country } = req.body;

    // 1. Jib l'user mn DB
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // 2. Update dyal les champs li jayo (optional kolo)
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (city) user.city = city;
    if (country) user.country = country;

    // 3. Saif
    await user.save();

    // 4. Send Response (bla password)
    return res.status(200).json({
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        sex: user.sex,
        country: user.country,
        city: user.city,
        isPeriodMode: user.isPeriodMode
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
};

module.exports = {
  getMe,
  updateProfile
};