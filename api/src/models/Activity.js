const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  durationMinutes: { 
    type: Number, 
    required: true 
  },
  
  // خانة التوقيت المطلوبة للجدولة الأوتوماتيكية
  preferredTimeSlot: { 
    type: String, 
    enum: [
      'AT_PRAYER_TIME', 
      'POST_FAJR', 
      'POST_DHUHR', 
      'POST_ASR', 
      'POST_MAGHRIB', 
      'POST_ISHA', 
      'BEFORE_SLEEP',
      'ANYTIME'
    ],
    required: true 
  },
  
  // الأولوية للحالات الطارئة (Emergency Mode)
  priority: { 
    type: String, 
    enum: ['NON_NEGOTIABLE', 'HIGH', 'MEDIUM', 'LOW'], 
    default: 'MEDIUM' 
  },
  
  // أيام التكرار بالأرقام الصريحة: 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 7 = Sun
  // النشاط اليومي: [1,2,3,4,5,6,7]
  repeatDays: {
    type: [Number],
    default: [1,2,3,4,5,6,7],
    validate: {
      validator: function (days) {
        if (!Array.isArray(days) || days.length === 0) return false;
        return days.every((day) => Number.isInteger(day) && day >= 1 && day <= 7);
      },
      message: 'repeatDays must be non-empty weekday numbers between 1 and 7'
    }
  },
type: {
  type: String,
  enum: [
    'PRAYER',
    'QURAN',
    'ADHKAR',
    'DUA',
    'SLEEP',
    'MEAL',
    'STUDY',
    'WORK',
    'SPORT',
    'CHESS',
    'PERSONAL',
    'OTHER'
  ],
  default: 'OTHER'
},
  
  // نشاط بديل مخصص لمرحلة العذر الشرعي
  isAlternativeForPeriod: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);