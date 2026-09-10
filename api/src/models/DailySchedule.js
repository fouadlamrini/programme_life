const mongoose = require('mongoose');
const timeBlockSchema = require('./TimeBlock');

const dailyScheduleSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  
  // الوضع الحاكم للجدولة فـ هاد النهار
  mode: { 
    type: String, 
    enum: [
      'NORMAL', 
      'FRIDAY', 
      'RAMADAN', 
      'AID_ADHA', 
      'AID_FITR', 
      'EMERGENCY', 
      'SPECIAL_MODE'
    ], 
    
    default: 'NORMAL' 
  },
  
  
  // الأنشطة المجدولة بـ وقتها وحالتها (Snapshot)
  timeBlocks: [timeBlockSchema]
}, { timestamps: true });

module.exports = mongoose.model('DailySchedule', dailyScheduleSchema);