// server.js
require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// 1. Connection m3a Database
connectDB().then(() => {
  // 2. Dmarrag l-Server ghir mlli t-ntajah l-connection b-najah
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});