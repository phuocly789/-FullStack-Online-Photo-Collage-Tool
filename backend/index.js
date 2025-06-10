require('dotenv').config();
const express = require('express');
const multer = require('multer');
const Queue = require('bull');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors({ origin: 'http://54.206.215.123:3000/' }));
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

// Hàm async khởi động toàn bộ ứng dụng
async function startServer() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log('Upload dir ready:', UPLOAD_DIR);

    // Route kiểm tra
    app.get('/', (req, res) => {
      res.send('Backend is running!');
    });

    app.post('/api/create-task', upload.array('images'), async (req, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          throw new Error('No files uploaded');
        }
        const job = await queue.add({
          files: req.files.map(file => file.path),
          layout: req.body.layout,
          border_width: parseInt(req.body.border_width) || 0,
          border_color: req.body.border_color || '#ffffff'
        });
        res.json({ task_id: job.id });
      } catch (error) {
        console.error('Error in create-task:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to create task', details: error.message });
      }
    });

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

    app.get('/api/get-collage', async (req, res) => {
      const collageId = req.query.id;
      if (!collageId) return res.status(400).json({ error: 'Missing collage ID' });

      const collagePath = path.join(UPLOAD_DIR, `collage_${collageId}.png`);
      try {
        await fs.access(collagePath); // check tồn tại
        res.sendFile(collagePath);
      } catch (err) {
        res.status(404).json({ error: 'Collage not found' });
      }
    });

    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err.message, err.stack);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });

  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
}

// Gọi hàm để khởi động app
startServer();
