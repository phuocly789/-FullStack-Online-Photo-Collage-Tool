const request = require('supertest');
const { app, startServer } = require('../index');
const Queue = require('bull');
const fs = require('fs');

// Mock các module
jest.mock('bull');
jest.mock('fs', () => {
  // Tạo mock stream thủ công với các phương thức cần thiết
  const mockStream = {
    write: jest.fn(),
    end: jest.fn(),
    once: jest.fn(function(event, cb) {
      if (event === 'finish') {
        setImmediate(cb); // Giả lập sự kiện finish
      }
      if (event === 'error') {
        setImmediate(() => cb(new Error('Mocked error')));
      }
      return this; // Trả về mockStream để hỗ trợ chaining
    }),
    on: jest.fn(function(event, cb) {
      if (event === 'finish') {
        setImmediate(cb); // Giả lập sự kiện finish
      }
      if (event === 'error') {
        setImmediate(() => cb(new Error('Mocked error')));
      }
      return this; // Trả về mockStream để hỗ trợ chaining
    }),
    emit: jest.fn(function(event, ...args) {
      if (event === 'error') {
        setImmediate(() => this.on(event, () => {})(new Error('Mocked error')));
      }
      return this;
    }),
    removeListener: jest.fn(function(event, cb) {
      return this;
    }),
    listenerCount: jest.fn((event) => 1), // Giả lập listenerCount trả về 1
    pipe: jest.fn((dest) => dest), // Giả lập pipe để tránh lỗi
  };

  return {
    promises: {
      mkdir: jest.fn(),
      readdir: jest.fn(),
      stat: jest.fn().mockResolvedValue({
        isFile: () => true,
        size: 1024,
        mtime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
        mode: 0o666, // Quyền file
      }),
      unlink: jest.fn(),
    },
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    createWriteStream: jest.fn(() => mockStream), // Mock createWriteStream
    stat: jest.fn((path, cb) =>
      cb(null, {
        isFile: () => true,
        size: 1024,
        mtime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
        mode: 0o666,
      })
    ),
  };
});
jest.mock('sharp', () => () => ({
  toBuffer: jest.fn().mockResolvedValue({ data: Buffer.from(''), info: { width: 100, height: 100 } }),
  resize: jest.fn().mockReturnThis(),
  composite: jest.fn().mockReturnThis(),
  png: jest.fn().mockReturnThis(),
  toFile: jest.fn().mockResolvedValue(),
}));

describe('Express API', () => {
  let server;

  beforeEach(() => {
    process.env.NODE_ENV = 'test'; // Đặt môi trường test
    jest.clearAllMocks();
    Queue.prototype.add = jest.fn().mockResolvedValue({ id: '123' });
    Queue.prototype.getJob = jest.fn().mockResolvedValue({
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: '123',
    });
    fs.existsSync.mockReturnValue(true);
  });

  beforeEach((done) => {
    server = startServer(0);
    server.on('listening', done);
  });

  afterEach((done) => {
    if (server) {
      server.close(() => {
        server = null;
        done();
      });
    } else {
      done();
    }
  });

  test('GET / returns status message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Backend is running!');
  });

  test('POST /api/create-task creates a task', async () => {
    const response = await request(app)
      .post('/api/create-task')
      .attach('images', Buffer.from('test-image-content'), 'test.png')
      .field('layout', 'horizontal')
      .field('border_width', '10')
      .field('border_color', '#ffffff');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('task_id', '123');
    expect(Queue.prototype.add).toHaveBeenCalled();
  }, 10000);

  test('POST /api/create-task fails with no files', async () => {
    const response = await request(app)
      .post('/api/create-task')
      .field('layout', 'horizontal');
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Failed to create task');
  });

  test('GET /api/check-status returns job status', async () => {
    const response = await request(app).get('/api/check-status?id=123');
    expect(response.status).toBe(404);
  });

  test('GET /api/get-collage returns collage file', async () => {
    fs.existsSync.mockReturnValue(true);
    const response = await request(app).get('/api/get-collage?id=123');
    expect(response.status).toBe(200);
  });
});