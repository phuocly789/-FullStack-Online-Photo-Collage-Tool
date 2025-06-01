require('dotenv').config();
const Queue = require('bull');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

const queue = new Queue('image-processing', REDIS_URL);

queue.process(async job => {
  try {
    console.log('Processing job:', job.id, job.data);
    const { files, layout, border_width, border_color } = job.data;

    const images = await Promise.all(
      files.map(async (filePath, index) => {
        console.log(`Reading image ${index}: ${filePath}`);
        return sharp(filePath).toBuffer({ resolveWithObject: true });
      })
    );

    let totalWidth, totalHeight, result;

    if (layout === 'horizontal') {
      const minHeight = Math.min(...images.map(img => img.info.height));
      console.log('Min height:', minHeight);
      const resized = await Promise.all(
        images.map(async (img, index) => {
          console.log(`Resizing image ${index} to height ${minHeight}`);
          return sharp(img.data).resize({ height: minHeight }).toBuffer({ resolveWithObject: true });
        })
      );
      totalWidth = resized.reduce((sum, img) => sum + img.info.width, 0) + border_width * (resized.length + 1);
      totalHeight = minHeight + 2 * border_width;
      console.log('Canvas size:', { totalWidth, totalHeight });

      result = sharp({
        create: {
          width: Math.max(1, totalWidth),
          height: Math.max(1, totalHeight),
          channels: 4,
          background: border_color
        }
      });

      const composites = [];
      let x = border_width;
      for (const [index, img] of resized.entries()) {
        console.log(`Preparing composite for image ${index} at x=${x}`);
        composites.push({ input: img.data, left: Math.round(x), top: border_width });
        x += img.info.width + border_width;
      }
      console.log('Compositing all images:', composites);
      await result.composite(composites);
    } else {
      const minWidth = Math.min(...images.map(img => img.info.width));
      console.log('Min width:', minWidth);
      const resized = await Promise.all(
        images.map(async (img, index) => {
          console.log(`Resizing image ${index} to width ${minWidth}`);
          return sharp(img.data).resize({ width: minWidth }).toBuffer({ resolveWithObject: true });
        })
      );
      totalHeight = resized.reduce((sum, img) => sum + img.info.height, 0) + border_width * (resized.length + 1);
      totalWidth = minWidth + 2 * border_width;
      console.log('Canvas size:', { totalWidth, totalHeight });

      result = sharp({
        create: {
          width: Math.max(1, totalWidth),
          height: Math.max(1, totalHeight),
          channels: 4,
          background: border_color
        }
      });

      const composites = [];
      let y = border_width;
      for (const [index, img] of resized.entries()) {
        console.log(`Preparing composite for image ${index} at y=${y}`);
        composites.push({ input: img.data, left: border_width, top: Math.round(y) });
        y += img.info.height + border_width;
      }
      console.log('Compositing all images:', composites);
      await result.composite(composites);
    }

    const outputPath = path.join(UPLOAD_DIR, `collage_${job.id}.png`);
    console.log('Saving collage to:', outputPath);
    await result.png().toFile(outputPath);
    console.log('Collage saved');

    for (const file of files) {
      try {
        await fs.unlink(file);
        console.log(`Deleted temp file: ${file}`);
      } catch (err) {
        console.warn(`Failed to delete temp file ${file}:`, err.message);
      }
    }

    console.log('Returning job.id:', job.id);
    return job.id;
  } catch (error) {
    console.error('Error in worker:', error.message, error.stack);
    throw error;
  }
});

queue.on('error', error => {
  console.error('Queue error:', error);
});
queue.on('active', job => {
  console.log('Job active:', job.id);
});
queue.on('completed', (job, result) => {
  console.log('Job completed:', job.id, 'Return value:', result);
});
queue.on('failed', (job, error) => {
  console.error('Job failed:', job.id, error.message, error.stack);
});

console.log('Worker started');