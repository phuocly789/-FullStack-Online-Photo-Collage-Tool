require('dotenv').config();
const express = require('express');
const multer = require('multer');
const Queue = require('bull');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/image\/(png|jpeg)/)) {
      console.error('File rejected:', file.originalname, 'Invalid format');
      return cb(new Error('Only PNG and JPEG are allowed'));
    }
    cb(null, true);
  }
});

const queue = new Queue('image-processing', REDIS_URL);

// Tạo thư mục uploads nếu chưa tồn tại
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log('Created upload directory:', UPLOAD_DIR);
}

// Route kiểm tra
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Route API tạo task
app.post('/api/create-task', upload.array('images'), async (req, res) => {
  try {
    console.log('Received create-task request:');
    console.log('Files:', req.files);
    console.log('Body:', req.body);
    if (!req.files || req.files.length === 0) {
      throw new Error('No files uploaded');
    }
    const job = await queue.add({
      files: req.files.map(file => file.path),
      layout: req.body.layout,
      border_width: parseInt(req.body.border_width) || 0,
      border_color: req.body.border_color || '#ffffff'
    });
    console.log('Job added to queue:', job.id);
    res.json({ task_id: job.id });
  } catch (error) {
    console.error('Error in create-task:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create task', details: error.message });
  }
});

// API kiểm tra trạng thái
app.get('/api/check-status', async (req, res) => {
  const jobId = req.query.id;
  if (!jobId) return res.status(400).json({ status: 'ERROR', message: 'Missing task ID' });
  const job = await queue.getJob(jobId);
  if (!job) return res.status(404).json({ status: 'NOT_FOUND' });

  const state = await job.getState();
  if (state === 'completed') {
    return res.json({ status: 'DONE', collage_id: job.returnvalue });
  }
  res.json({ status: state });
});

// API lấy ảnh ghép
app.get('/api/get-collage', (req, res) => {
  const collageId = req.query.id;
  if (!collageId) return res.status(400).json({ error: 'Missing collage ID' });

  const collagePath = path.join(UPLOAD_DIR, `collage_${collageId}.png`);
  if (!fs.existsSync(collagePath)) {
    return res.status(404).json({ error: 'Collage not found' });
  }

  res.sendFile(collagePath, err => {
    if (err) {
      console.error('Error sending collage:', err);
      res.status(500).json({ error: 'Failed to send collage' });
    }
  });
});

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message, err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});