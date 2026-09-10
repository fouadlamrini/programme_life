const mongoose = require('mongoose');

// Schema فرعية كتستعمل غير داخل DailySchedule لحماية الأرشيف التاريخي
const timeBlockSchema = new mongoose.Schema({
  activityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Activity' 
  },
  title: { 
    type: String, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true // صيغة "05:20"
  },
  endTime: { 
    type: String, 
    required: true // صيغة "06:00"
  },
  priority: { 
    type: String, 
    enum: ['NON_NEGOTIABLE', 'HIGH', 'MEDIUM', 'LOW'] 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'], 
    default: 'PENDING' 
  }
});

module.exports = timeBlockSchema;