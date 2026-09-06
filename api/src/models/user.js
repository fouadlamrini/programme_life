// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  sex: { type: String, enum: ['MALE', 'FEMALE'], required: true },
  country: { type: String, default: 'Morocco' },
  city: { type: String, default: 'Nador' },
  
  isPeriodMode: { type: Boolean, default: false },
  refreshToken: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);