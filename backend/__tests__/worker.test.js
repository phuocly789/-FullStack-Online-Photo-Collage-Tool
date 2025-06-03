const Queue = require('bull');
const sharp = require('sharp');
const fs = require('fs').promises;

// Mock các module
jest.mock('sharp');
jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn(),
  },
}));
jest.mock('bull');

describe('Image Processing Worker', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    jest.clearAllMocks();
    sharp.mockReturnValue({
      toBuffer: jest.fn().mockResolvedValue({ data: Buffer.from(''), info: { width: 100, height: 100 } }),
      resize: jest.fn().mockReturnThis(),
      composite: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      toFile: jest.fn().mockResolvedValue(),
    });
  });


  test('processes horizontal layout correctly', async () => {
    const job = {
      id: '123',
      data: {
        files: ['file1.png', 'file2.png'],
        layout: 'horizontal',
        border_width: 10,
        border_color: '#ffffff',
      },
    };

    const { processJob } = require('../worker'); // Lấy hàm processJob
    const result = await processJob(job);

    expect(sharp).toHaveBeenCalledWith({
      create: expect.objectContaining({
        channels: 4,
        background: '#ffffff',
      }),
    });
    expect(result).toBe('123');
  });

  test('handles errors in processing', async () => {
    sharp.mockImplementation(() => {
      throw new Error('Processing error');
    });

    const job = {
      id: '123',
      data: {
        files: ['file1.png'],
        layout: 'vertical',
        border_width: 10,
        border_color: '#ffffff',
      },
    };

    const { processJob } = require('../worker'); // Lấy hàm processJob
    await expect(processJob(job)).rejects.toThrow('Processing error');
  });
});