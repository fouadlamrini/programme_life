// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
 password: { type: String, required: true, select: false },
  sex: { type: String, enum: ['homme', 'femme'], required: true },
  country: { type: String, default: 'Morocco' },
  city: { type: String, default: 'Nador' },
  
  isPeriodMode: { type: Boolean, default: false },
  onboardingCompleted: { type: Boolean, default: false },
  refreshToken: { type: String, default: null },
  // مدة النوم المطلوبة بالدقائق (المستخدم يحددها فقط — وقت الاستيقاظ يُحسب دائماً من الفجر)
  sleepTargetMinutes: { type: Number, default: 480, min: 60, max: 1440 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);