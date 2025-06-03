require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

const uploadDir = process.env.UPLOAD_DIR || '/app/uploads';
const isTest = process.env.NODE_ENV === 'test';

console.log = isTest ? () => {} : console.log;
console.error = isTest ? () => {} : console.error;

setInterval(async () => {
  try {
    const files = await fs.readdir(uploadDir);
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.stat(filePath);
      const age = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60); // Giờ
      if (age > 24) {
        await fs.unlink(filePath);
        console.log(`Deleted old file: ${file}`);
      }
    }
  } catch (err) {
    console.error('Error cleaning up files:', err);
  }
}, 60 * 60 * 1000); // Chạy mỗi giờ